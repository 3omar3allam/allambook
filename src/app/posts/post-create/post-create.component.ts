import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { PostService } from '../post.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Post } from '../post.model';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { imageCompress } from './image.compress';

const enum mode  {
  create=0,
  edit=1,
};

@Component({
  selector: 'app-post-create',
  templateUrl: './post-create.component.html',
  styleUrls: ['./post-create.component.css']
})
export class PostCreateComponent implements OnInit, OnDestroy {

  form: FormGroup;
  private mode = mode.create;
  private postId: string;
  public post: Post;
  isLoading = false;
  imagePreview: string;
  imageFile: File;
  imageDelete: boolean;
  imageError: boolean;

  private authStatusSub: Subscription;
  private compressSub: Subscription;

  constructor(
    private postService: PostService,
    private route: ActivatedRoute,
    private auth: AuthService) { }

  ngOnInit() {
    this.authStatusSub = this.auth.getAuthStatus().subscribe(
      _=> {
        this.isLoading = false;
      }
    );
    setTimeout(()=>{
      document.getElementById('focus').focus();
    },500);
    this.form = new FormGroup({
      content: new FormControl(null, {
        validators: [Validators.required],
      }),
      image: new FormControl(null, {
        validators : null
      }),
    });
    this.imageFile = null;
    this.imageDelete = false;
    this.route.paramMap.subscribe((paramMap:ParamMap) => {
      if(paramMap.has('id')){
        this.mode = mode.edit;
        this.postId = paramMap.get('id');
        this.isLoading = true;
        this.postService.getPost(this.postId)
          .subscribe(postData => {
            this.isLoading = false;
            this.post = {
              id: postData._id,
              creator: postData.creator,
              content: postData.content,
              imagePath: postData.imagePath,
              date: postData.date,
              edited: postData.edited,
              dateDiff: null,
              showContent: null,
              showImage: undefined,
            };
            this.form.patchValue({
              content: this.post.content,
            });
            if(this.post.imagePath){
              this.imagePreview = this.post.imagePath;
              this.form.get('content').clearValidators();
              this.form.get('content').updateValueAndValidity();
            }
          });
      } else{
        this.mode = mode.create;
        this.postId = null;
      }
    });
  }

  ngOnDestroy() {
    this.authStatusSub.unsubscribe();
    if(this.compressSub)this.compressSub.unsubscribe();
  }

  onSavePost(){
    if(this.form.invalid) return;
    let content = this.form.get('content').value;
    if(content == null) content = "";
    if (this.mode == mode.create){
      this.postService.addPost(
        content,
        this.imageFile,
        new Date()
      );
    } else{
      this.postService.editPost(
        this.postId,
        content,
        this.imageFile,
        this.post,
        this.imageDelete
      );
    }
  }

  onImagePicked(event: Event){
    this.imageFile = (event.target as HTMLInputElement).files[0];
    this.compressSub = imageCompress(this.imageFile).subscribe(
      ({file,preview}) => {
        this.form.get('content').clearValidators();
        this.form.get('content').updateValueAndValidity();
        this.imageError = false;
        this.imageFile = file;
        this.imagePreview = preview;
      },_error=>{
        this.imageError = true;
        this.deleteImage();
      });
  }
  deleteImage(){
    this.form.get('content').setValidators(Validators.required);
    this.form.get('content').updateValueAndValidity();
    this.imageDelete = true;
    this.imagePreview = null;
    this.form.patchValue({image:null});
    this.imageFile = null;
  }
}