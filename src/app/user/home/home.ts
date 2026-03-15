import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { VideoService } from '../../shared/services/video-service';
import { WatchlistService } from '../../shared/services/watchlist-service';
import { NotificationService } from '../../shared/services/notification-service';
import { UtilityService } from '../../shared/services/utility-service';
import { DialogService } from '../../shared/services/dialog-service';
import { MediaService } from '../../shared/services/media-service';
import { ErrorHandlerService } from '../../shared/services/error-handler-service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home implements OnInit, OnDestroy {
  allVideos: any[] = [];
  filteredVideos: any[] = [];
  loading = true;
  loadingMore = false;
  error = false;
  searchQuery: string = '';

  featuredVideos: any[] = [];
  currentSlideIndex = 0;
  featuredLoading = true;

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  hasMoreVideos = true;

  private searchSubject = new Subject<string>();
  private sliderInterval: any;
  private savedScrollPosition: number = 0;

  constructor(
    private videoService: VideoService,
    private watchlistService: WatchlistService,
    private notification: NotificationService,
    private utilityService: UtilityService,
    private mediaService: MediaService,
    private dialogService: DialogService,
    private errorHandlerService: ErrorHandlerService,
    private cd:ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFeaturedVideos();
    this.loadVideos();
    this.initializeSearchDebounce();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
    this.stopSlider();
  }

  private initializeSearchDebounce(): void {
    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.performSearch();
      });
  }

  loadFeaturedVideos(): void {
    this.featuredLoading = true;
    this.videoService.getFeaturedVideos().subscribe({
      next: (videos: any) => {
        this.featuredVideos = videos;
        this.featuredLoading = false;
        if (this.featuredVideos.length > 1) {
          this.startSlider();
        }
      },
      error: (err) => {
        this.featuredLoading = false;
        this.errorHandlerService.handle(ErrorHandlerService, 'Error loading featured videos');
      },
    });
  }

  private startSlider(): void {
    this.sliderInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  private stopSlider(): void {
    if (this.sliderInterval) {
      clearInterval(this.sliderInterval);
    }
  }

  nextSlide(): void {
    if (this.featuredVideos.length > 0) {
      this.currentSlideIndex = (this.currentSlideIndex + 1) % this.featuredVideos.length;
    }
  }

  prevSlide(): void {
    if (this.featuredVideos.length > 0) {
      this.currentSlideIndex = (this.currentSlideIndex - 1 + this.featuredVideos.length) % this.featuredVideos.length;
    }
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
    this.stopSlider();
    if (this.featuredVideos.length > 1) {
      this.startSlider();
    }
  }

  getCurrentFeaturedVideos() {
    return this.featuredVideos[this.currentSlideIndex] || null;
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const scrollPosition = window.pageYOffset + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;

    if (scrollPosition >= pageHeight - 200 && !this.loadingMore && !this.loading && this.hasMoreVideos) {
      this.loadMoreVideos();
    }
  }

  loadVideos(page: number = 0): void {
    this.error = false;
    this.currentPage = 0;
    this.allVideos = [];
    this.filteredVideos = [];
    const search = this.searchQuery.trim() || undefined;
    const isSearching = !!search;
    this.loading = true;

    this.videoService.getPublishedVideosPaginated(page, this.pageSize, search).subscribe({
      next: (response: any) => {
        this.allVideos = response.content;
        this.filteredVideos = response.content;
        this.currentPage = response.number;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasMoreVideos = this.currentPage < this.totalPages - 1;
        this.loading = false;
        this.cd.detectChanges();

        if (isSearching && this.savedScrollPosition > 0) {
          setTimeout(() => {
            window.scrollTo({ top: this.savedScrollPosition, behavior: 'auto' });
            this.savedScrollPosition = 0;
          }, 0);
        }
      },
      error: (err) => {
        console.error('Error loading videos:', err);
        this.error = true;
        this.loading = false;
        this.savedScrollPosition = 0;
      },
    });
  }

  loadMoreVideos(): void {
    if (this.loadingMore || !this.hasMoreVideos) return;
    this.loadingMore = true;
    const nextPage = this.currentPage + 1;
    const search = this.searchQuery.trim() || undefined;

    this.videoService.getPublishedVideosPaginated(nextPage, this.pageSize, search).subscribe({
      next: (response: any) => {
        this.allVideos = [...this.allVideos, ...response.content];
        this.filteredVideos = [...this.filteredVideos, ...response.content];
        this.currentPage = response.number;
        this.hasMoreVideos = this.currentPage < this.totalPages - 1;
        this.loadingMore = false;
      },
      error: (err) => {
        this.notification.error('Failed to load more videos');
        this.loadingMore = false;
      },
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  private performSearch(): void {
    this.savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    this.currentPage = 0;
    this.loadVideos();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage = 0;
    this.savedScrollPosition = 0;
    this.loadVideos();
  }

  isInWatchlist(video: any): boolean {
    return video.isInWatchlist === true;
  }

  toggleWatchlist(video: any, event?: Event): void {
    if (event) event.stopPropagation();

    const videoId = video.id!;
    const isInList = this.isInWatchlist(video);

    if (isInList) {
      video.isInWatchlist = false;
      this.watchlistService.removeFromWatchlist(videoId).subscribe({
        next: () => this.notification.success('Removed from My favorites'),
        error: (err) => {
          video.isInWatchlist = true;
          this.errorHandlerService.handle(err, 'Failed to remove from My Favorites. Please try again.');
        },
      });
    } else {
      video.isInWatchlist = true;
      this.watchlistService.addToWatchlist(videoId).subscribe({
        next: () => this.notification.success('Added to My favorites'),
        error: (err) => {
          video.isInWatchlist = false;
          this.errorHandlerService.handle(err, 'Failed to add My Favorites. Please try again.');
        },
      });
    }
  }

  getPosterUrl(video: any): string {
    return this.mediaService.getMediaUrl(video, 'image', { useCache: true }) || '';
  }

  playVideo(video: any): void {
    this.dialogService.openVideoPlayer(video);
  }

  formatDuration(seconds: number | undefined): string {
    return this.utilityService.formatDuration(seconds);
  }
}