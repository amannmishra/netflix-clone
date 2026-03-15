import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { RATINGS, VIDEO_CATEGORIES } from '../../../shared/constants/app.constants';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { MediaService } from '../../../shared/services/media-service';
import { VideoService } from '../../../shared/services/video-service';
import { NotificationService } from '../../../shared/services/notification-service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ErrorHandlerService } from '../../../shared/services/error-handler-service';

@Component({
  selector: 'app-manage-video',
  standalone: false,
  templateUrl: './manage-video.html',
  styleUrl: './manage-video.css',
})
export class ManageVideo implements OnInit {

  isSaving = false;
  uploadProgress = 0;
  posterProgress = 0;

  categoriesAll = VIDEO_CATEGORIES;
  ratings = RATINGS;

  videoForm!: FormGroup;

  videoPreviewUrl: string | null = null;
  posterPreviewUrl: string | null = null;

  videoLoading = false;
  posterLoading = false;

  isEditMode = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private errorHandlerService: ErrorHandlerService,
    private videoService: VideoService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef,
    private mediaService: MediaService,
    public dialogRef: MatDialogRef<ManageVideo>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.isEditMode = data?.mode === 'edit';

    this.videoForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      year: [new Date().getFullYear(), Validators.required],
      rating: ['', Validators.required],
      categories: [[], [Validators.required, ManageVideo.arrayNotEmpty]],
      duration: [0],
      src: ['', Validators.required],
      poster: ['', Validators.required],
      published: [false]
    });
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data?.video) {
      const video = this.data.video;

      this.videoForm.patchValue({
        title: video.title,
        description: video.description,
        year: video.year,
        rating: video.rating,
        categories: Array.isArray(video.category)
          ? video.category
          : video.category
            ? [video.category]
            : [],
        duration: video.duration,
        src: video.src,
        poster: video.poster,
        published: video.published
      });

      if (video.src) this.loadVideoPreview(video.src);
      if (video.poster) this.loadPosterPreview(video.poster);
    }
  }

  // ✅ Custom validator
  static arrayNotEmpty(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return { required: true };
    }
    return null;
  }

  private loadVideoPreview(value: string | null) {
    this.videoPreviewUrl = this.mediaService.getMediaUrl(value, 'video');
    this.videoLoading = false;
    this.cdr.detectChanges();
  }

  private loadPosterPreview(value: string | null): void {
    this.posterPreviewUrl = this.mediaService.getMediaUrl(value, 'image');
    this.posterLoading = false;
    this.cdr.detectChanges();
  }

  private extractUuidFromUrl(value: string | undefined | null): string {
    if (!value) return '';
    if (!value.includes('/')) return value;
    const segments = value.split('/');
    return segments[segments.length - 1] || '';
  }

  onVideoPicked(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const validVideoExtensions = [
      '.mp4', '.webm', '.ogg', '.mov', '.avi',
      '.wmv', '.flv', '.mkv', '.avchd', '.mpeg'
    ];

    const fileName = file.name.toLowerCase();
    const hasValidExtension = validVideoExtensions.some(ext => fileName.endsWith(ext));
    const hasValidType = file.type.startsWith('video/') || file.type === 'application/octet-stream';

    if (!hasValidExtension && !hasValidType) {
      this.error = 'Please select a valid video file (MP4, MKV, etc.)';
      return;
    }

    const localBlobUrl = URL.createObjectURL(file);
    this.videoPreviewUrl = localBlobUrl;

    this.extractDurationFromFile(file);

    this.uploadProgress = 0;

    this.mediaService.uploadFile(file).subscribe({
      next: ({ progress, uuid }) => {
        this.uploadProgress = progress;
        if (uuid) {
          this.videoForm.patchValue({ src: uuid });
          this.notification.success('Video uploaded successfully.');
        }
      },
      error: () => {
        this.notification.error('Failed to upload video. Please try again later.');
        this.uploadProgress = 0;
        if (this.videoPreviewUrl === localBlobUrl) {
          URL.revokeObjectURL(localBlobUrl);
          this.videoPreviewUrl = null;
        }
      }
    });
  }

  onPosterClicked(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.notification.error('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.posterPreviewUrl = e.target?.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);

    this.posterProgress = 0;

    this.mediaService.uploadFile(file).subscribe({
      next: ({ progress, uuid }) => {
        this.posterProgress = progress; // ✅ FIXED
        if (uuid) {
          this.videoForm.patchValue({ poster: uuid });
          this.notification.success('Poster uploaded successfully.');
        }
      },
      error: () => {
        this.notification.error('Failed to upload poster. Please try again later.');
        this.posterProgress = 0;
        this.posterPreviewUrl = null;
      }
    });
  }

  private extractDurationFromFile(file: File) {
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';

    const blobUrl = URL.createObjectURL(file);
    videoElement.src = blobUrl;

    videoElement.onloadedmetadata = () => {
      const duration = isFinite(videoElement.duration)
        ? Math.floor(videoElement.duration)
        : 0;

      this.videoForm.patchValue({ duration });
      URL.revokeObjectURL(blobUrl);
    };

    videoElement.onerror = () => {
      URL.revokeObjectURL(blobUrl);
    };
  }

  onSave() {
    if (this.videoForm.invalid) {
      this.videoForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    const formData = this.videoForm.value;

    const op$ = this.isEditMode
      ? this.videoService.updateVideoByAdmin(this.data.video.id, formData)
      : this.videoService.createVideoByAdmin(formData);

    op$.subscribe({
      next: (response: any) => {
        this.isSaving = false;
        this.notification.success(response?.message || 'Video saved successfully.');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isSaving = false;
        this.errorHandlerService.handle(err, 'Failed to save video. Please try again.');
      }
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  removeVideo() {
    if (this.videoPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.videoPreviewUrl);
    }
    this.videoPreviewUrl = null;
    this.videoForm.patchValue({ src: '', duration: 0 });
    this.uploadProgress = 0;
  }

  removePoster() {
    if (this.posterPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.posterPreviewUrl);
    }
    this.posterPreviewUrl = null;
    this.videoForm.patchValue({ poster: '' });
    this.posterProgress = 0;
  }

}