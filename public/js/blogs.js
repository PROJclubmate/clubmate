function getValidUrl(givenUrl){
  let newUrl = decodeURI(givenUrl);
  newUrl = newUrl.trim().replace(/\s/g, "");

  if(/^(:\/\/)/.test(newUrl)){
    return `http${newUrl}`;
  }
  if(!/^(f|ht)tps?:\/\//i.test(newUrl)){
    return `http://${newUrl}`;
  }

  return newUrl;
}


window.onload=function(){
  document.getElementById('load-more-btn').click();
}
$('#load-more-btn').on('click', function(e){
  e.preventDefault();
  $('#load-more-span').addClass("spinner-border spinner-border-sm mr-1");
  const collegeName = $('#load-more-btn').attr('college_name');
  const route = $('#load-more-btn').attr('route');
  let url, data;
  if(route == 'index'){
    url = '/colleges/'+ collegeName +'/blogs';
    data = {bucket: $('#load-more-btn').val()}
  } else if(route == 'saved'){
    url = '/colleges/'+ collegeName +'/blogs/saved';
    data = {bucket: $('#load-more-btn').val(), index: $('#load-more-btn').attr('index')}
  } else if(route == 'user'){
    url = '/colleges/'+ collegeName +'/blogs/user/'+ $('#load-more-btn').attr('user_id');
    data = {bucket: $('#load-more-btn').val(), index: $('#load-more-btn').attr('index')}
  }

  $.ajax({
    type: 'GET',
    url: url,
    data: data,
    timeout: 15000,
    success: function (response){
      if(response && response != ''){
        $('#load-more-btn').removeClass('btn-load');
        $('#load-more-btn').val(response.bucket);
        if(route == 'user'){
          $('#load-more-btn').attr('index', response.index);
        }
        const div = document.getElementById('client-blogs');
        div.innerHTML += blogs_template(response, route);
        $('#load-more-btn').html('<span id="load-more-span"></span>Load More').blur();
      } else{
        $('#load-more-btn').addClass('d-none');
        $('#load-more-btn').html('<span id="load-more-span"></span>Load More').blur();
      }

      if((route == 'saved' || route == 'user') && response.blogs.length < 20){
        $('#load-more-btn').addClass('d-none');
        $('#load-more-btn').html('<span id="load-more-span"></span>Load More').blur();
      }
    }
  });
});


$('div#client-blogs').on('click', '.blogvote', function(e){
  e.preventDefault();
  e.stopImmediatePropagation();
  const collegeName = $('#load-more-btn').attr('college_name');
  const bucketId = $(this).attr('bucketId');
  const blogId = $(this).attr('blogId');

  if($(this).hasClass('vote-save')){
    $.ajax({
      type: 'PUT',
      url: '/colleges/'+ collegeName +'/blogs/'+ bucketId +'/'+ blogId +'/save',
      timeout: 15000,
      success: function (response){
        if(response.saved === true){
          $('#'+blogId+'_save').find('i').addClass('fas bookmarked');
          $('#'+blogId+'_save').find('i').removeClass('far');
        }
        else{
          $('#'+blogId+'_save').find('i').addClass('far');
          $('#'+blogId+'_save').find('i').removeClass('fas bookmarked');
        }
      }
    });
  } else if($(this).hasClass('vote-heart')){
    $.ajax({
      type: 'PUT',
      url: '/colleges/'+ collegeName +'/blogs/'+ bucketId +'/'+ blogId +'/heart',
      timeout: 15000,
      success: function (response){        
        $('#'+blogId+'_heart-count').text(response.heartCount);
        if($('#'+blogId+'_heart-count').text() == 0){
          $('#'+blogId+'_heart-count').addClass('invisible');
        } else{
          $('#'+blogId+'_heart-count').removeClass('invisible');
        }
        $('#'+blogId+'_heart-btn').toggleClass('redcolor2');
        $('#'+blogId+'_heart-count').toggleClass('redcolor3');
      }
    });
  }
});

function blogs_template(response, route){
  html = ejs.render(`
<% blogs.reverse() %>

<div class="container my-3">
  <% for(let blog of blogs){ %>
    <div class="row no-gutters">
      <div class="card blog-card mx-auto rounded">
        <div class="card-pad">
          <% if(!blog.isNews){ %>
            <div class="row no-gutters px-2">
              <div class="col valign">
                <div>
                  <a href="/colleges/<%= college %>/blogs/user/<%= blog.author.id %>" class="darkgrey p-name boldtext d-flex">
                    <img src="<%= blog.author.profilePic %>" class="smalldp rounded-circle mr-2 my-auto" alt="...">
                    <span class="card-text mobiletext3"><%= blog.author.name %></span>
                  </a>
                </div>
                <% if(isCollegeLevelAdmin && route == 'index'){ %>
                  <div class="reject d-none d-inline-block">
                    <form action="/colleges/<%= college %>/blogs/<%= blog.bucketId %>/<%= blog._id %>?_method=DELETE" method="post">
                      <input type="hidden" name="blogId" value="<%= blog._id %>">
                      <button type="submit" class="btn btn-sm btnxs btn-danger"><i class="fas fa-trash-alt"></i></button>
                    </form>
                  </div>
                <% } %>
              </div>
            </div>
            <div class="valign">
              <div class="pt-1 w-100">
                <div class="px-2">
                  <a href="<%= getValidUrl(blog.url) %>" class="nolink" rel="noopener" target="_blank">
                    <div class="valign mb-3">
                      <div>
												<h5 class="card-title darkgrey truncate1"><%= blog.title %></h5>
												<p class="card-text truncate3 blog-description linewrap"><%= blog.description %></p>
											</div>
                      <div class="mb-auto">
												<div class="pt-1 ml-1">
													<img src="<%= blog.image || '/images/noImage.png' %>" alt="..." class="searchdp mx-0 blogsdp noshadow cover mb-auto">
												</div>
											</div>
                    </div>
                  </a>
                  <div class="lightgrey d-flex flex-row">
                    <span class="mobileNone inline">Opens in</span><span class="text-capitalize"><%= blog.urlName %></span>
                  </div>
                  <div class="card-text valign">
                    <div>
                      <div class="text-sm mobiletext3 d-inline-block">
                        <span class="lightgrey"><%= moment(blog.createdAt).format('ll') %></span>
                      </div>
                      <div class="separator d-inline-block mx-1">
                        ·
                      </div>
                      <div class="d-inline-block">
                        <span class="text-sm mobiletext3"><span class="lightgrey mr-2"><%= blog.readTime %> min</span></span>
                      </div>
                    </div>
                    <div>
                      <div class="icons d-flex flex-row-reverse">
                        <div class="saveblog ml-2 my-auto">
                          <button id="<%= blog._id %>_save" class="vote blogvote vote-save valign" type="button" title="Save blog" blogId="<%= blog._id %>" bucketId="<%= blog.bucketId %>">
                            <% if(blog.saved){ %>
                              <i class="fas fa-bookmark bookmarked"></i>
                            <% } else{ %>
                              <i class="far fa-bookmark"></i>
                            <% } %>
                          </button>
                        </div>
                        <div class="commentwrap lineheight-0 d-inline-block ml-1 my-auto">
                          <% if(blog.hearted){ %>
                            <button id="<%= blog._id %>_heart-btn" class="vote redcolor2 blogvote vote-heart valign" type="button" title="Heart blog" blogId="<%= blog._id %>" bucketId="<%= blog.bucketId %>">
                              <div>
                                <i class="fab fa-gratipay"></i>
                              </div>
                              <div id="<%= blog._id %>_heart-count" class="vote boldtext text-xs bluecolor3 ml-1 blogcount" type="button" title="Heart blog">
                                <%= blog.heartCount %>
                              </div>
                            </button>
                          <% } else{ %>
                            <button id="<%= blog._id %>_heart-btn" class="vote blogvote vote-heart valign" type="button" title="Heart blog" blogId="<%= blog._id %>" bucketId="<%= blog.bucketId %>">
                              <div>
                                <i class="fab fa-gratipay"></i>
                              </div>
                              <% if(blog.heartCount > 0){ %>
                                <div id="<%= blog._id %>_heart-count" class="vote boldtext text-xs lightgrey ml-1 blogcount" type="button" title="Heart blog">
                              <% } else{ %>
                                <div id="<%= blog._id %>_heart-count" class="vote boldtext text-xs lightgrey ml-1 blogcount invisible" type="button" title="Heart blog">
                              <% } %>
                                <%= blog.heartCount %>
                              </div>
                            </button>
                          <% } %>
                        </div>
                      </div>
                    </div>  
                  </div>
                </div>
              </div>
            </div>
          <% } %>
          <% if(blog.isNews) { %>
            <div class="row no-gutters px-2">
              <div class="col valign">
                <div class="news smalldp lightgrey">
                  <i class="far fa-newspaper"></i>
                </div>
                <% if(isCollegeLevelAdmin && route == 'index'){ %>
                  <div class="reject d-none d-inline-block">
                    <form action="/colleges/<%= college %>/blogs/<%= blog.bucketId %>/<%= blog._id %>?_method=DELETE" method="post">
                      <input type="hidden" name="blogId" value="<%= blog._id %>">
                      <button type="submit" class="btn btn-sm btnxs btn-danger"><i class="fas fa-trash-alt"></i></button>
                    </form>
                  </div>
                <% } %>
              </div>
            </div>
            <div class="valign"> 
              <div class="pt-1 w-100">
                <div class="px-2">
                  <a href="<%= getValidUrl(blog.url) %>" class="nolink" target="_blank">
										<h5 class="card-title darkgrey truncate1"><%= blog.title %></h5>
										<p class="card-text truncate5 news-description linewrap"><%= blog.description %></p>
									</a>
                  <% if(blog.urlName){ %>
                    <div class="lightgrey">
                      <span class="mobileNone inline">Opens in</span><span class="text-capitalize"><%= blog.urlName %></span>
                    </div>
                  <% } %>
                  <div class="card-text valign mt-3">
                    <div class="text-sm mobiletext3">
                      <span class="lightgrey"><%= moment(blog.createdAt).format('ll') %></span>
                    </div>
                    <div class="saveblog">
                      <button id="<%= blog._id %>_save" class="vote blogvote vote-save valign" type="button" title="Save blog" blogId="<%= blog._id %>" bucketId="<%= blog.bucketId %>">
                        <% if(blog.saved){ %>
                          <i class="fas fa-bookmark bookmarked"></i>
                        <% } else{ %>
                          <i class="far fa-bookmark"></i>
                        <% } %>
                      </button>
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
  `, {blogs: response.blogs, college: response.college, isCollegeLevelAdmin: response.isCollegeLevelAdmin, route});
  return html;
}
