window.onload=function(){
  document.getElementById('load-more-btn').click();
}
$('#load-more-btn').on('click', function(e){
  e.preventDefault();
  $('#load-more-span').addClass("spinner-border spinner-border-sm mr-1");
  var collegeName = $('#load-more-btn').attr('college_name');
  $.ajax({
    type: 'GET',
    url: '/colleges/'+ collegeName +'/blogs',
    data: {bucket: $('#load-more-btn').val()},
    timeout: 15000,
    success: function (response){
      if(response && response != ''){

        $('#load-more-btn').removeClass('btn-load');
        $('#load-more-btn').val(response.bucket);
        var div = document.getElementById('client-blogs');
        div.innerHTML += blogs_template(response);
        $('#load-more-btn').html('<span id="load-more-span"></span>Load More').blur();

        const cards = document.querySelectorAll(".blog-card")
        for(let card of cards){
          const blog_id = card.getAttribute('id')
          const bucketId = card.getAttribute('bucketId')
          const saveSelector = blog_id + '_save';
          const saveIcon = document.getElementById(saveSelector);
          const heartSelector = blog_id + '_heart';
          const heartIcon = document.getElementById(heartSelector);

          saveIcon.addEventListener('click', e => {
            $.ajax({
              type: 'PUT',
              url: '/colleges/'+ collegeName +'/blogs/'+ bucketId +'/'+ blog_id +'/save',
              timeout: 15000,
              success: function (response){
                if(response.saved){
                  saveIcon.classList.add('fas')
                  saveIcon.classList.remove('far')
                }
                else{
                  saveIcon.classList.add('far')
                  saveIcon.classList.remove('fas')
                }
              }
            });
          });

          heartIcon.addEventListener('click', e => {
            $.ajax({
              type: 'PUT',
              url: '/colleges/'+ collegeName +'/blogs/'+ bucketId +'/'+ blog_id +'/heart',
              timeout: 15000,
              success: function (response){
                if(response.hearted){
                  heartIcon.classList.add('redcolor3')
                  heartIcon.classList.add('fas')
                  heartIcon.classList.remove('far')
                }
                else {
                  heartIcon.classList.remove('redcolor3')
                  heartIcon.classList.add('far')
                  heartIcon.classList.remove('fas')
                }
              }
            });
          });
        }

      }
      else {
        console.log("hello")
        $('#load-more-btn').addClass('d-none');
        $('#load-more-btn').html('<span id="load-more-span"></span>Load More').blur();
      }
    }
  });
});

function blogs_template(response){
  html = ejs.render(`
<style>
  .blog-card {
    border-left: 0;
    border-right: 0;
    width: 50vw;
    border: 0.5px solid #cccccc;
    overflow: hidden;
  }
	.icons:hover, .p-name:hover {
		cursor: pointer;
	}
	.saveblog{
		font-size: 1.25rem !important;
	}
	.saveblog .far.fa-bookmark{
		-webkit-text-stroke: 0.75px white;
	}
	.card-pad{
		padding: 1rem 1rem;
	}
	.card-title{
		line-height: 1.75rem;
	}

	@media (max-width: 767px) {
		.blog-card {
			width: 100%;
      border-color: #dcdcdc !important;
			margin-left: 0.5rem !important;
			margin-right: 0.5rem !important;
		}
		.searchdp.blogsdp{
			height: 50px !important;
			width: 50px !important;
		}
		.card-pad{
			padding: 1rem 0;
		}
	}
</style>

<% blogs.reverse() %>

<div class="container my-3">
	<% for(let blog of blogs){ %>
		<div class="row no-gutters">
			<div class="card mx-auto blog-card rounded">
				<div class="card-pad">
					<% if(blog.author){ %>
						<div class="row pl-2 w-100">
							<div class="col">
								<a href="/colleges/<%= college %>/blogs/user/<%= blog.author.id %>" class="darkgrey p-name boldtext d-flex">
									<img src="<%= blog.author.profilePic %>" class="smalldp rounded-circle mr-2 my-auto" alt="...">
									<span class="card-text mobiletext3"><%= blog.author.name %></span>
								</a>
							</div>
						</div>
						<div class="valign">      
							<div class="pt-1 w-100">
								<div class="px-2">							
									<a href="<%= decodeURI(blog.url) %>" class="card-link" rel="noopener" target="_blank">
										<div class="valign mb-3">
											<div>								
												<h5 class="card-title truncate1"><%= blog.title %></h5>
												<p class="card-text truncate3 fade_text"><%= blog.description %></p>       
											</div>
											<div class="mb-auto">
												<div class="pt-1 ml-1">
													<img src="<%= blog.image || '/images/noImage.png' %>" alt="..." class="searchdp mx-0 blogsdp noshadow cover mb-auto">
												</div>
											</div>
										</div>
									</a>
									<div class="card-text valign">   
										<div>
											<div class="text-sm mobiletext3 d-inline-block">
												<span class="text-muted"><%= moment(blog.createdAt).format('ll') %></span>
											</div>
											<div class="separator d-inline-block mx-1">
												·
											</div>
											<div class="d-inline-block">                
												<span class="text-sm mobiletext3 text-muted mr-2"><%= blog.readTime %> min</span>
											</div>
										</div>
										<div>
											<div class="icons d-flex flex-row">
												<div class="saveblog mx-1">
													<i class="far fa-bookmark"></i>
												</div>
												<div class="commentwrap lineheight-0 d-inline-block ml-1 my-auto">         
													<button class="vote commentvote valign" name="commentUp" type="button" value="up" title="Upvote comment">
														<div>
														<i class="fab fa-gratipay"></i>
														</div>											
														<div class="vote boldtext text-xs lightgrey ml-1 commentcount invisible" name="commentUp" type="button" value="up" title="Upvote comment">0</div>
													</button>                                         
												</div>
											</div>
										</div>
									</div>   
								</div>
							</div>                                 
						</div> 
					<% } %>
					<% if(!blog.author) { %>
						<div class="row pl-2 w-100">
							<div class="col">
								<span class="news smalldp">
									<i class="far fa-newspaper"></i>
								</span>
							</div>
						</div>			
						<div class="valign">      
							<div class="pt-1 w-100">
								<div class="px-2">							
									<a href="<%= blog.url %>" class="card-link" target="_blank">
										<h5 class="card-title truncate1"><%= blog.title %></h5>
										<p class="card-text"><%= blog.description %></p>
									</a>
									<div class="card-text valign mt-3">   
										<div>
											<div class="text-sm mobiletext3">
												<span class="text-muted"><%= moment(blog.createdAt).format('ll') %></span>
											</div>
										</div>   
										<div>
											<span class="icons">
												<span class="saveblog ml-1">
													<i class="far fa-bookmark"></i>
												</span>
												<div class="commentwrap lineheight-0 d-inline-block ml-1">         
													<button id="comment-up-btn5f089c8e3059ce0ec90836b4" class="vote commentvote valign" name="commentUp" type="button" value="up" title="Upvote comment">
														<div>
														<i class="fab fa-gratipay"></i>
														</div>
														
														<div id="comment-up-count5f089c8e3059ce0ec90836b4" class="vote boldtext text-xs lightgrey ml-1 commentcount invisible" name="commentUp" type="button" value="up" title="Upvote comment">0</div>
													</button>                                         
												</div>
											</span>
										</div>                
									</div>          
								</div>
							</div>
						</div>
					<% } %>
				</div>
			</div>
		</div>
	<% } %>
</div>
  `, {blogs: response.blogs, college: response.college});
  return html;
}
