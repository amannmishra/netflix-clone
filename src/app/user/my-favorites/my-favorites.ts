import { Component, HostListener } from '@angular/core';
import { VideoService } from '../../shared/services/video-service';
import { WatchlistService } from '../../shared/services/watchlist-service';
import { NotificationService } from '../../shared/services/notification-service';
import { UtilityService } from '../../shared/services/utility-service';
import { MediaService } from '../../shared/services/media-service';
import { DialogService } from '../../shared/services/dialog-service';
import { ErrorHandlerService } from '../../shared/services/error-handler-service';
import { ChangeDetectorRef } from '@angular/core';

import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-my-favorites',
  standalone: false,
  templateUrl: './my-favorites.html',
  styleUrl: './my-favorites.css',
})
export class MyFavorites {
  allVideos: any[] = [];
  filteredVideos: any[] = [];
  loading = true;
  loadingMore = false;
  error = false;
  searchQuery: string = '';


  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;
  hasMoreVideos = true;

  private searchSubject = new Subject<String>();
  constructor(
    private videoService: VideoService,
    private watchlistService: WatchlistService,
    private notification: NotificationService,
    private utilityService: UtilityService,
    private mediaService: MediaService,
    private dialogService: DialogService,
    private errorHandlerService: ErrorHandlerService,
    private cd:ChangeDetectorRef
  ) { }
  ngOnInit(): void {
    this.loadVideos();
    this.initializeSearchDebounce();
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  private initializeSearchDebounce(): void {
    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.performSearch();
      });
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
    this.loading = true;

    this.watchlistService.getWatchlist(page, this.pageSize, search).subscribe({
      next: (response: any) => {
        this.allVideos = response.content;
        this.filteredVideos = response.content;
        this.currentPage = response.number;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasMoreVideos = this.currentPage < this.totalPages - 1;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error loading videos:', err);
        this.error = true;
        this.loading = false;
      },
    });
  }

  loadMoreVideos(): void {
    if (this.loadingMore || !this.hasMoreVideos) return;
    this.loadingMore = true;
    const nextPage = this.currentPage + 1;
    const search = this.searchQuery.trim() || undefined;

    this.watchlistService.getWatchlist(nextPage, this.pageSize, search).subscribe({
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
    this.currentPage = 0;
    this.loadVideos();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.currentPage = 0;
    this.loadVideos();
  }

  toggleWatchlist(video:any,event?:Event){
    if (event) {
      event.stopPropagation();
    }
    const videoId=video.id!;
    this.watchlistService.removeFromWatchlist(videoId).subscribe({
      next:()=>{
        this.allVideos=this.allVideos.filter((v:any)=>v.id !==videoId);
        this.notification.success('Removed from My Favorites');
      },
      error:(err)=>{
        this.errorHandlerService.handle(err,'Failed to reove from My Favorites. please try again.')
      }
    })
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
