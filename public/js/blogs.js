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
          console.log("hi")
          $('#load-more-btn').removeClass('btn-load');
          $('#load-more-btn').val(response.bucket);
          var div = document.getElementById('client-blogs');
          div.innerHTML += blogs_template(response);
          $('#load-more-btn').html('<span id="load-more-span"></span>Load More').blur();
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
      <div class="container my-3">
        <% for(let blog of blogs){ %>
          <div class="row no-gutters">
            <div class="card mb-3 mx-auto blog-card pt-3 pb-2 px-3">
              <% if(blog.author){ %>
                <div class="row top-content">
                  <div class="col">
                    <img src="https://miro.medium.com/fit/c/140/140/1*lENffNJqMW4fiDhqz7PlNw.png" class="smalldp rounded-circle mr-1" alt="...">
                    <span class="card-text"><a href="/add" class="card-link p-name"><%= blog.author.name %></a></span>             
                  </div>
                </div>
                <div class="valign"> 
                  <div class="pt-1 w-100">
                    <div class="card-body">
                      <a href="<%= blog.url %>" class="card-link" target="_blank">
                        <div class="valign mb-3">
                          <div class="">								
                            <h5 class="card-title"><%= blog.title %></h5>
                            <p class="card-text truncate5"><%= blog.description %></p>       
                          </div>
                          <div class="">
                            <div class="pt-1">
                              <img src="https://miro.medium.com/fit/c/140/140/1*lENffNJqMW4fiDhqz7PlNw.png" alt="..." class="card-image mb-auto">
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
                            <span class="text-sm mobiletext3"><span class="text-muted mr-2"><%= blog.readTime %> min</span></span>
                          </div>
                        </div>
                        <div>
                          <span class="icons">
                            <span class="save-icon ml-1">
                              <i class="far fa-bookmark"></i>
                            </span>
                            <div class="commentwrap lineheight-0 d-inline-block ml-1">         
                              <button class="vote commentvote valign" name="commentUp" type="button" value="up" title="Upvote comment">
                                <div>
                                <i class="fab fa-gratipay"></i>
                                </div>											
                                <div class="vote boldtext text-xs lightgrey ml-1 commentcount invisible" name="commentUp" type="button" value="up" title="Upvote comment">0</div>
                              </button>                                         
                            </div>
                          </span>
									      </div>  
                      </div>
                    </div>
                  </div>
                </div>
              <% } %>
              <% if(!blog.author) { %>
                <div class="row top-content">
                  <div class="col">
                    <span class="news smalldp">
                      <i class="far fa-newspaper"></i>
                    </span>
                  </div>
                </div>
                <div class="valign"> 
                  <div class="pt-1 w-100">
                    <div class="card-body">	
                      <a href="<%= blog.url %>" class="card-link" target="_blank">
                        <h5 class="card-title"><%= blog.title %></h5>
                        <p class="card-text truncate5"><%= blog.description %></p>
                      </a>
                      <div class="card-text valign mt-3">
                        <div>
                          <div class="text-sm mobiletext3">
                            <span class="text-muted"><%= moment(blog.createdAt).format('ll') %></span>
                          </div>
                        </div>
                        <div>
                          <span class="icons">
                            <span class="save-icon ml-1">
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
        <% } %>
      </div>
    `,{blogs: response.blogs});
    return html;
  }
