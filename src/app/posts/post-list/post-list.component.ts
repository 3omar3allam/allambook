import { Component, OnInit, OnDestroy } from '@angular/core';
import { Post } from '../post.model';
import { PostService } from '../post.service';
import { Subscription } from 'rxjs';
import { PageEvent } from '@angular/material';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-post-list',
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css']
})
export class PostListComponent implements OnInit, OnDestroy {

  posts: Post[] = [];
  private postsSub: Subscription;
  private authStatusSubs: Subscription;
  private loggedUserSubs: Subscription;
  private refreshSubs: Subscription;

  isLoading = false;
  authenticated = false;
  user: {id: string, name: string};

  totalPosts = 0;
  pageSize = 10;
  currentPage = 1;
  pageSizeOptions = [5,10,25,50];


  constructor(private postService: PostService, private auth: AuthService) { }

  ngOnInit() {
    this.isLoading = true;
    this.postService.getPosts(this.pageSize,this.currentPage);
    this.authenticated = this.auth.isAuthenticated();
    if(this.authenticated){
      this.user = {
        id: this.auth.getAuth().id,
        name: `${this.auth.getAuth().firstName} ${this.auth.getAuth().lastName}`,
      }
    }

    this.postsSub = this.postService.getPostUpdateListener()
      .subscribe(data => {
        this.posts = data.posts.map(post => {
          if(post.image){
            post.image.path = this.postService.createImageUrl(post.image.type,post.image.binary);
          }
          return post
        });
        this.totalPosts = data.total;
        this.timeDelta();
        this.urlify();
        this.isLoading = false;
      });
    this.authStatusSubs = this.auth.getAuthStatus()
      .subscribe(isAuthenticated => {
        this.authenticated = isAuthenticated;
      });
    this.loggedUserSubs = this.auth.getLoggedUserListener()
      .subscribe(loggedUser => {
        if(loggedUser.id && loggedUser.firstName && loggedUser.lastName){
          this.user = {
            id: loggedUser.id,
            name: `${loggedUser.firstName} ${loggedUser.lastName}`,
          }
        }
      });
    this.refreshSubs = this.auth.getRefreshListener()
      .subscribe(() => {
        this.ngOnInit();
      });
  }

  ngOnDestroy(){
    this.postsSub.unsubscribe();
    this.authStatusSubs.unsubscribe();
    this.loggedUserSubs.unsubscribe();
    this.refreshSubs.unsubscribe();
  }

  onDelete(id: string){
    this.isLoading = true;
    this.postService.deletePost(id).subscribe(response=>{
      this.postService.getPosts(this.pageSize,this.currentPage);
      this.auth.openSnackBar(response.message);
    },_error=>{
      this.isLoading = false;
    });
  }

  onChangePage(pageData: PageEvent){
    this.isLoading = true;
    this.currentPage = pageData.pageIndex + 1;
    this.pageSize = pageData.pageSize;
    this.postService.getPosts(this.pageSize,this.currentPage);
  }

  imageError(event){
    event.target.parentElement.classList.remove('post-image');
  }

  toggleImage(post){
    post.showImage = !post.showImage;
  }

  private timeDelta(){
    let now = new Date();
    this.posts.forEach(post => {
      post.showImage = false;
      let milliDiff = now.getTime() - new Date(post.date).getTime();
      let yearDiff = Math.floor(milliDiff/ (1000*3600*24*365));
      if(yearDiff){
        post.dateDiff = `${yearDiff} year`;
        if(yearDiff>1) post.dateDiff += 's';
        return;
      }
      let monthDiff = Math.floor(milliDiff/ (1000*3600*24*30));
      if(monthDiff){
        post.dateDiff = `${monthDiff} month`;
        if(monthDiff>1) post.dateDiff += 's';
        return;
      }
      let weekDiff = Math.floor(milliDiff/ (1000*3600*24*7));
      if(weekDiff){
        post.dateDiff = `${weekDiff} week`;
        if(weekDiff>1) post.dateDiff += 's';
        return;
      }
      let dayDiff = Math.floor(milliDiff/ (1000*3600*24));
      if(dayDiff){
        post.dateDiff = `${dayDiff} day`;
        if(dayDiff>1) post.dateDiff += 's';
        return;
      }
      let hourDiff = Math.floor(milliDiff/ (1000*3600));
      if(hourDiff){
        post.dateDiff = `${hourDiff} hour`;
        if(hourDiff>1) post.dateDiff += 's';
        return;
      }
      let minDiff = Math.floor(milliDiff/ (1000*60));
      if(minDiff){
        post.dateDiff = `${minDiff} minute`;
        if(minDiff>1) post.dateDiff += 's';
        return;
      }
      let secDiff= Math.floor(milliDiff/ 1000);
      post.dateDiff = `${secDiff} second`;
      if(secDiff>1) post.dateDiff += 's';
    });
  }

  private urlify(){
    let urlRegex = /(http(s)?:\/\/)?(www\.)?([\w\-]+\.)?([\w\-]+)(:\d)?(\.[a-z]{2,3})+(\/[\w\-\.]+)*(\?[^\s]+)?/gi;
    let groups = {
      protocol: 1,
      ssl: 2,
      www: 3,
      subdomain: 4,
      domain: 5,
      port: 6,
      tlp: 7,
      path: 8,
      params: 9,
    }
    this.posts.forEach(post=>{
      let links = post.content.match(urlRegex);
      post.showContent = post.content;
      if(!links){
        return;
      }
      else{
        for(let link of links){
          let urlComponents = urlRegex.exec(link);
          urlRegex.lastIndex = 0;
          let protocol = "";
          if(!urlComponents[groups.protocol] && !urlComponents[groups.www]){
            protocol = "http://";
          }
          post.showContent = post.showContent.replace(
            link,
            `<a href=\'${protocol+link}\' target="_blank">${link}</a>`
          );
        }
      }
    });
  }
}
