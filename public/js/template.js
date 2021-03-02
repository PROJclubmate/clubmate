if(location.pathname == '/home'){
  window.onload=function(){
    document.getElementById('load-more-btn').click();
  }
  $('#load-more-btn').on('click', function(e){
    e.preventDefault();
    $('#load-more-span').addClass("spinner-border spinner-border-sm mr-1");
    $.ajax({
      type: 'GET',
      url: '/home-morePosts', 
      data: {ids: $('#load-more-btn').val()},
      timeout: 3000,
      success: function (response){
        var arr = response.foundPostIds;
        if(arr && arr != '' && response.arrLength && response.posts.length){
          if($('#load-more-btn').val() != ''){
          $('#load-more-btn').val(arr.concat($('#load-more-btn').val()));
          var div = document.getElementById('client-posts');
          div.innerHTML += index_posts_template(response);
          } else{
            $('#load-more-btn').removeClass('btn-load');
            $('#load-more-btn').val(arr);
            var div = document.getElementById('client-posts');
            div.innerHTML += index_posts_template(response);
          }
          $('#load-more-btn').html('<span id="load-more-span"></span>Load More').blur();
          
        } else{
          $('#load-more-btn').addClass('nodisplay');
        }
        $('#load-more-btn').html('<span id="load-more-span"></span>Load More').blur();
      }
    });
  });
}

if(location.pathname == '/friends_posts'){
  window.onload=function(){
    document.getElementById('load-more-btn').click();
  }
  $('#load-more-btn').on('click', function(e){
    e.preventDefault();
    $('#load-more-span').addClass("spinner-border spinner-border-sm mr-1");
    $.ajax({
      type: 'GET',
      url: '/friends_posts-morePosts',
      data: {ids: $('#load-more-btn').val()},
      timeout: 3000,
      success: function (response){
        var arr = response.foundPostIds;
        if(arr && arr != '' && response.arrLength && response.posts.length){
          if($('#load-more-btn').val() != ''){
            $('#load-more-btn').val(arr.concat($('#load-more-btn').val()));
            var div = document.getElementById('client-posts');
            div.innerHTML += index_posts_template(response);
          } else{
            $('#load-more-btn').removeClass('btn-load');
            $('#load-more-btn').val(arr);
            var div = document.getElementById('client-posts');
            div.innerHTML += index_posts_template(response);
          }
          $('#load-more-btn').html('<span id="load-more-span"></span>Load More').blur();
        } else{
          $('#load-more-btn').addClass('nodisplay');
        }
        $('#load-more-btn').html('<span id="load-more-span"></span>Load More').blur();
      }
    });
  });
}

if(location.pathname == '/discover'){
  window.onload=function(){
    document.getElementById('load-more-btn').click();
  }
  $('#load-more-btn').on('click', function(e){
    e.preventDefault();
    $('#load-more-span').addClass("spinner-border spinner-border-sm mr-1");
    $.ajax({
      type: 'GET',
      url: '/discover-morePosts',
      data: {ids: $('#load-more-btn').val()},
      timeout: 3000,
      success: function (response){
        var arr = response.foundPostIds;
        if(arr && arr != '' && response.arrLength && response.posts.length){
          if($('#load-more-btn').val() != ''){
            $('#load-more-btn').val(arr.concat($('#load-more-btn').val()));
            var div = document.getElementById('client-posts-discover');
            div.innerHTML += discover_posts_template(response);
          } else{
            $('#load-more-btn').removeClass('btn-load');
            $('#load-more-btn').val(arr);
            var div = document.getElementById('client-posts-discover');
            div.innerHTML += discover_posts_template(response);
          }
          // 2 column masonry
          var left_column_height = 0;
          var right_column_height = 0;
          var items = $('.discovercard');
          for (var i=0;i<items.length;i++){
            if (left_column_height > right_column_height) {
              right_column_height+= items.eq(i).addClass('right').outerHeight(true);
            } else{
              left_column_height+= items.eq(i).outerHeight(true);
            }
          };
          $('#load-more-btn').html('<span id="load-more-span"></span>Load More').blur();
        } else{
          $('#load-more-btn').addClass('nodisplay');
          $('#load-more-btn').html('<span id="load-more-span"></span>Load More').blur();
        }
      }
    });
  });
} 

if(location.pathname.split('/').length == 3 && location.pathname.split('/')[1] == 'clubs' && 
  location.pathname.split('/')[2].match(/^[a-fA-F0-9]{24}$/)){
  window.onload=function(){
    document.getElementById('load-more-btn').click();
  }
  $('#load-more-btn').on('click', function(e){
    e.preventDefault();
    $('#load-more-span').addClass("spinner-border spinner-border-sm mr-1");
    $.ajax({
      type: 'GET',
      url: '/clubs-morePosts/'+location.pathname.split('/').pop(),
      data: {ids: $('#load-more-btn').val()},
      timeout: 3000,
      success: function (response){
        var arr = response.foundPostIds;
        if(arr && arr != '' && response.arrLength && response.posts.length){
          if($('#create-new-post').length){
            $('#client-posts').removeClass('topnotch-left topnotch-right nodisplay');
          } else{
            $('#client-posts').removeClass('nodisplay');
          }
          if($('#load-more-btn').val() != ''){
            $('#load-more-btn').val(arr.concat($('#load-more-btn').val()));
            var div = document.getElementById('client-posts');
            div.innerHTML += club_posts_template(response);
          } else{
            $('#load-more-btn').removeClass('btn-load');
            $('#load-more-btn').val(arr);
            var div = document.getElementById('client-posts');
            div.innerHTML += club_posts_template(response);
          }
          $('#load-more-btn').html('<span id="load-more-span"></span>Load More').blur();
        } else{
          $('#load-more-btn').addClass('nodisplay');
        }
        $('#load-more-btn').html('<span id="load-more-span"></span>Load More').blur();
      }
    });
  });

  $('#alltime-posts-btn').on('click', function(e){
    if(!$('#alltime-posts-btn').hasClass('done')){
      $.ajax({
        type: 'GET',
        url: '/clubs-allTimeTopTopicPosts/'+location.pathname.split('/')[2],
        timeout: 3000,
        success: function (response){
          var arr = response.topTopicPosts.length;
          if(arr && arr > 0){
            var div = document.getElementById('alltime');
            div.innerHTML = allTimeTopTopicPosts_template(response);
            $('#alltime-posts-btn').addClass('done');
          }
        }
      });
    }
  });

  $('#load-more-members-btn').on('click', function(e){
    e.preventDefault();
    $('#load-more-members-span').addClass("spinner-border spinner-border-sm mr-1");
    $.ajax({
      type: 'GET',
      url: '/clubs-moreMembers/'+location.pathname.split('/')[2],
      data: {endpoints: $('#load-more-members-btn').val()},
      timeout: 3000,
      success: function (response){
        var arr = response.users;
        if(arr && arr != ''){
          var newEndpoints = response.newEndpoints;
          $('#load-more-members-btn').val(newEndpoints);
          var div = document.getElementById('client-members');
          div.innerHTML += moreMembers_template(response);
          if(arr.length < 10){
            $('#load-more-members-btn').addClass('nodisplay');
          }
        } else{
          $('#load-more-members-btn').addClass('nodisplay');
        }
        $('#load-more-members-btn').html('<span id="load-more-members-span"></span>Load More').blur();
      }
    });
  });

  $('#search-members-btn').on('click', function(e){
    e.preventDefault();
    $('#search-members-span').addClass("spinner-border spinner-border-sm mr-1");
    $.ajax({
      type: 'GET',
      url: '/clubs-searchMembers/'+location.pathname.split('/')[2],
      data: {name: $('#search-members-input').val()},
      timeout: 3000,
      success: function (response, textStatus, xhr){
        if(xhr.status == 200 && response.users && response.users != ''){
          var div = document.getElementById('server-members');
          div.innerHTML = moreMembers_template(response);
          $('#load-more-members-btn').addClass('nodisplay');
          $('#server-members').addClass('mt-2');
          $('#client-members').addClass('nodisplay');
        } else{
          var div = document.getElementById('server-members');
          if(xhr.status == 200){
            div.innerHTML = `<div class="text-center lightgrey text-sm pt-1">No matching names found</div>`
          } else if(xhr.status == 400){
            div.innerHTML = `<div class="text-center lightgrey text-sm pt-1">Please enter a valid member name</div>`
          } else if(xhr.status == 204){
            div.innerHTML = `<div class="text-center lightgrey text-sm pt-1">You are not a club member :/</div>`
          }
          $('#load-more-members-btn').addClass('nodisplay');
          $('#server-members').addClass('mt-2');
          $('#client-members').addClass('nodisplay');
        }
        $('#search-members-btn').html('<span id="search-members-span"></span>Go').blur();
      }
    });
  });

  $('#load-more-memberRequests-btn').on('click', function(e){
    e.preventDefault();
    $('#load-more-memberRequests-span').addClass("spinner-border spinner-border-sm mr-1");
    $.ajax({
      type: 'GET',
      url: '/clubs-moreMemberRequests/'+location.pathname.split('/')[2],
      data: {endpoints: $('#load-more-memberRequests-btn').val()},
      timeout: 3000,
      success: function (response){
        var arr = response.users;
        if(arr && arr != ''){
          var newEndpoints = response.newEndpoints;
          $('#load-more-memberRequests-btn').val(newEndpoints);
          var div = document.getElementById('client-memberRequests');
          div.innerHTML += moreMemberRequests_template(response);
          if(arr.length < 10){
            $('#load-more-memberRequests-btn').addClass('nodisplay');
          }
        } else{
          $('#load-more-memberRequests-btn').addClass('nodisplay');
        }
        $('#load-more-memberRequests-btn').html('<span id="load-more-memberRequests-span"></span>Load More').blur();
      }
    });
  });
}

if(location.pathname.split('/').length == 3 && location.pathname.split('/')[1] == 'users' && 
  location.pathname.split('/')[2].match(/^[a-fA-F0-9]{24}$/)){
  window.onload=function(){
    document.getElementById('load-more-btn').click();
  }
  $('#load-more-btn').on('click', function(e){
    e.preventDefault();
    $('#load-more-span').addClass("spinner-border spinner-border-sm mr-1");
    $.ajax({
      type: 'GET',
      url: '/users-morePosts/'+location.pathname.split('/').pop(),
      data: {ids: $('#load-more-btn').val()},
      timeout: 3000,
      success: function (response){
        var arr = response.foundPostIds;
        if(arr && arr != '' && response.arrLength && response.posts.length){
          $('#client-posts').removeClass('nodisplay');
          if($('#load-more-btn').val() != ''){
            $('#load-more-btn').val(arr.concat($('#load-more-btn').val()));
            var div = document.getElementById('client-posts');
            div.innerHTML += user_posts_template(response);
          } else{
            $('#load-more-btn').removeClass('btn-load');
            $('#load-more-btn').val(arr);
            var div = document.getElementById('client-posts');
            div.innerHTML += user_posts_template(response);
          }
        } else{
          $('#load-more-btn').addClass('nodisplay');
        }
        $('#load-more-btn').html('<span id="load-more-span"></span>Load More').blur();
      }
    });
  });

  $('#load-more-heart-btn').on('click', function(e){
    e.preventDefault();
    $('#load-more-heart-span').addClass("spinner-border spinner-border-sm mr-1");
    $.ajax({
      type: 'GET',
      url: '/heart-morePosts/'+location.pathname.split('/').pop(),
      data: {heartIds: $('#load-more-heart-btn').val()},
      timeout: 3000,
      success: function (response){
        var arr = response.foundHPostIds;
        if(arr && arr != '' && response.arrLength && response.posts.length){
          $('#client-heart-posts').removeClass('nodisplay');
          if($('#load-more-heart-btn').val() != ''){
            if(arr){
              $('#load-more-heart-btn').val(arr.concat($('#load-more-heart-btn').val()));
              var div = document.getElementById('client-heart-posts');
              div.innerHTML += heart_posts_template(response);
            }
          } else{
            $('#load-more-heart-btn').val(arr);
            var div = document.getElementById('client-heart-posts');
            div.innerHTML += heart_posts_template(response);
          }
        } else{
          $('#load-more-heart-btn').addClass('nodisplay');
        }
        $('#load-more-heart-btn').html('<span id="load-more-heart-span"></span>Load More').blur();
      }
    });
  });

  $('#load-more-clubs-btn').on('click', function(e){
    e.preventDefault();
    $('#load-more-clubs-span').addClass("spinner-border spinner-border-sm mr-1");
    $.ajax({
      type: 'GET',
      url: '/users-moreClubs/'+location.pathname.split('/')[2],
      data: {endpoints: $('#load-more-clubs-btn').val()},
      timeout: 3000,
      success: function (response){
        var arr = response.clubs;
        if(arr && arr != ''){
          var newEndpoints = response.newEndpoints;
          $('#load-more-clubs-btn').val(newEndpoints);
          var div = document.getElementById('client-clubs');
          div.innerHTML += moreClubs_template(response);
          if(arr.length < 10){
            $('#load-more-clubs-btn').addClass('nodisplay');
          }
        } else{
          $('#load-more-clubs-btn').addClass('nodisplay');
        }
        $('#load-more-clubs-btn').html('<span id="load-more-clubs-span"></span>Load More').blur();
      }
    });
  });

  $('#show-following-server').on('click', function(e){
    e.preventDefault();
    $.ajax({
      type: 'GET',
      url: '/show_following/'+location.pathname.split('/')[2],
      timeout: 3000,
      success: function (response){
        $('#show-following-server').addClass('nodisplay');
        $('#show-following-client').removeClass('nodisplay');
        var div = document.getElementById('show-following-client');
        div.innerHTML = showFollowing_template(response);
      }
    });
  });
}

if((location.pathname.split('/').length == 5 && location.pathname.split('/')[1] == 'clubs' && 
  location.pathname.split('/')[3] == 'posts' && location.pathname.split('/')[2].match(/^[a-fA-F0-9]{24}$/)) || 
  (location.pathname.split('/').length == 7 && location.pathname.split('/')[5] == 'subPost'))
{
  if($('#load-prevMsgs-btn')){
    $('#load-prevMsgs-btn').addClass('nodisplay');
  }

  $('#load-more-comments-btn').on('click', function(e){
    e.preventDefault();
    $('#load-more-comments-span').addClass("spinner-border spinner-border-sm mr-1");
    $.ajax({
      type: 'GET',
      url: '/moreComments/'+location.pathname.split('/').pop(),
      data: {newIndex: $('#load-more-comments-btn').val()},
      timeout: 3000,
      success: function (response){
        var arr = response.buckets;
        if(arr && arr != ''){
          if(response.index >= -1){
            $('#load-more-comments-btn').val(response.index);
            var div = document.getElementById('client-comments');
            div.innerHTML += post_comments_template(response);
          }
        } else{
          $('#load-more-comments-btn').addClass('nodisplay');
        }
        $('#load-more-comments-btn').html('<span id="load-more-comments-span"></span>Load More').blur();
      }
    });
  });
  
  $('#dynamic-subPosts').on('click', '.load-subPosts-btn', function(e){
    e.preventDefault();
    var value = $(this).attr('value'); 
    var url = $(this).attr('href'); 
    load_subPost_page(url,value);
  });
  // OR
  $('#dynamic-subPosts').on('click', '#page-index-button', function(e){
    e.preventDefault();
    var value = $('#page-index-input').val()-1;
    var url = $('#page-index-input').attr('href'); 
    load_subPost_page(url,value);
  });
}


function load_subPost_page(url,value){
  $.ajax({
    type: 'GET',
    url: url,
    data: {newIndex: value},
    timeout: 3000,
    success: function (response){
      if(response.index > -1){
        var div = document.getElementById('dynamic-subPosts');
        div.innerHTML = post_subPosts_template(response);
      }
    }
  });
}

if(location.pathname.split('/').length == 3 && location.pathname.split('/')[1] == 'find_people'){
  $('#load-more-search-people-btn').on('click', function(e){
    e.preventDefault();
    $('#load-more-search-people-span').addClass("spinner-border spinner-border-sm mr-1");
    var query = $('#query').attr('value');
    $.ajax({
      type: 'GET',
      url: '/people-moreResults/search/'+query,
      data: {ids: $('#load-more-search-people-btn').val()},
      timeout: 3000,
      success: function (response){
        var arr = response.foundUserIds;
        if(arr && arr != ''){
          if($('#load-more-search-people-btn').val() != ''){
            $('#load-more-search-people-btn').val(arr.concat($('#load-more-search-people-btn').val()));
            var div = document.getElementById('client-search-people');
            div.innerHTML += search_people_template(response);
          } else{
            $('#load-more-search-people-btn').val(arr);
          }
        } else{
          $('#load-more-search-people-btn').addClass('nodisplay');
        }
        $('#load-more-search-people-btn').html('<span id="load-more-search-people-span"></span>Load More').blur();
      }
    });
  });

  $('#load-more-filterSearch-people-btn').on('click', function(e){
    e.preventDefault();
    $('#load-more-filterSearch-people-span').addClass("spinner-border spinner-border-sm mr-1");
    var dbQuery = $('#searchFilter-btn').attr('value');
    $.ajax({
      type: 'GET',
      url: '/people-moreResults/filter_search',
      data: {ids: $('#load-more-filterSearch-people-btn').val(), url: $('#search-moreFilterPeople-btn').val()},
      timeout: 3000,
      success: function (response){
        var arr = response.foundUserIds;
        if(arr && arr != ''){
          if($('#load-more-filterSearch-people-btn').val() != ''){
            $('#load-more-filterSearch-people-btn').val(arr.concat($('#load-more-filterSearch-people-btn').val()));
            var div = document.getElementById('client-search-people');
            div.innerHTML += search_people_template(response);
          } else{
            $('#load-more-filterSearch-people-btn').val(arr);
          }
        } else{
          $('#load-more-filterSearch-people-btn').addClass('nodisplay');
        }
        $('#load-more-filterSearch-people-btn').html('<span id="load-more-filterSearch-people-span"></span>Load More').blur();
      }
    });
  });
}

if(location.pathname.split('/').length == 3 && location.pathname.split('/')[1] == 'find_clubs'){
  $('#load-more-search-clubs-btn').on('click', function(e){
    e.preventDefault();
    $('#load-more-search-clubs-span').addClass("spinner-border spinner-border-sm mr-1");
    var query = $('#query').attr('value');
    $.ajax({
      type: 'GET',
      url: '/clubs-moreResults/search/'+query,
      data: {ids: $('#load-more-search-clubs-btn').val()},
      timeout: 3000,
      success: function (response){
        var arr = response.foundClubIds;
        if(arr && arr != ''){
          if($('#load-more-search-clubs-btn').val() != ''){
            $('#load-more-search-clubs-btn').val(arr.concat($('#load-more-search-clubs-btn').val()));
            var div = document.getElementById('client-search-clubs');
            div.innerHTML += search_clubs_template(response);
          } else{
            $('#load-more-search-clubs-btn').val(arr);
          }
        } else{
          $('#load-more-search-clubs-btn').addClass('nodisplay');
        }
        $('#load-more-search-clubs-btn').html('<span id="load-more-search-clubs-span"></span>Load More').blur();
      }
    });
  });

  $('#load-more-filterSearch-clubs-btn').on('click', function(e){
    e.preventDefault();
    $('#load-more-filterSearch-clubs-span').addClass("spinner-border spinner-border-sm mr-1");
    var dbQuery = $('#searchFilter-btn').attr('value');
    $.ajax({
      type: 'GET',
      url: '/clubs-moreResults/filter_search',
      data: {ids: $('#load-more-filterSearch-clubs-btn').val(), url: $('#search-moreFilterClubs-btn').val()},
      timeout: 3000,
      success: function (response){
        var arr = response.foundUserIds;
        if(arr && arr != ''){
          if($('#load-more-filterSearch-clubs-btn').val() != ''){
            $('#load-more-filterSearch-clubs-btn').val(arr.concat($('#load-more-filterSearch-clubs-btn').val()));
            var div = document.getElementById('client-search-clubs');
            div.innerHTML += search_clubs_template(response);
          } else{
            $('#load-more-filterSearch-clubs-btn').val(arr);
          }
        } else{
          $('#load-more-filterSearch-clubs-btn').addClass('nodisplay');
        }
        $('#load-more-filterSearch-clubs-btn').html('<span id="load-more-filterSearch-clubs-span"></span>Load More').blur();
      }
    });
  });
}

if(location.pathname.split('/').length == 3 && location.pathname.split('/')[1] == 'find_colleges'){
  $('#load-more-search-college_pages-btn').on('click', function(e){
    e.preventDefault();
    $('#load-more-search-college_pages-span').addClass("spinner-border spinner-border-sm mr-1");
    var query = $('#query').attr('value');
    $.ajax({
      type: 'GET',
      url: '/colleges-moreResults/search/'+query,
      data: {ids: $('#load-more-search-college_pages-btn').val()},
      timeout: 3000,
      success: function (response){
        var arr = response.foundCollegePageIds;
        if(arr && arr != ''){
          if($('#load-more-search-college_pages-btn').val() != ''){
            $('#load-more-search-college_pages-btn').val(arr.concat($('#load-more-search-college_pages-btn').val()));
            var div = document.getElementById('client-search-college_pages');
            div.innerHTML += search_college_pages_template(response);
          } else{
            $('#load-more-search-college_pages-btn').val(arr);
          }
        } else{
          $('#load-more-search-college_pages-btn').addClass('nodisplay');
        }
        $('#load-more-search-college_pages-btn').html('<span id="load-more-search-college_pages-span"></span>Load More').blur();
      }
    });
  });
}

$('#load-prevMsgs-btn').on('click', function(e){
  e.preventDefault();
  if($("#pin-chatbox").hasClass("chatbox-user")){
    const conversationId = $("#user-convoId").attr("value").split(',')[0];
    if(conversationId){
      $('#load-prevMsgs-span').addClass("spinner-border spinner-border-sm mr-1");
      $.ajax({
        type: 'GET',
        url: '/prev-chatMsgs/'+conversationId,
        data: {ids: $('#load-prevMsgs-btn').val()},
        timeout: 3000,
        success: function (response){
          if(response.foundMessageId){
              var arr = response.foundMessageId;
              $('#prevMessage-div').removeClass('nodisplay');
              if($('#load-prevMsgs-btn').val() != ''){
                $('#load-prevMsgs-btn').val(arr.concat($('#load-prevMsgs-btn').val()));
                $('#prevMsgs-div').prepend(load_prevMsgs_template(response));
              } else{
                $('#load-prevMsgs-btn').val(arr);
              }
            } else{
              $('#load-prevMsgs-btn').addClass('nodisplay');
            }
          $('#load-prevMsgs-btn').html('<span id="load-prevMsgs-span"></span>LOAD PREV').blur();
        }
      });
    } else{
      $('#load-prevMsgs-btn').addClass('nodisplay');
    }
  } else if($("#pin-chatbox").hasClass("chatbox-club")){
    const conversationId = $("#club-convoId").attr("value").split('^')[0];
    if(conversationId){
      $('#load-prevMsgs-span').addClass("spinner-border spinner-border-sm mr-1");
      $.ajax({
        type: 'GET',
        url: '/prev-clubChatMsgs/'+conversationId,
        data: {ids: $('#load-prevMsgs-btn').val()},
        timeout: 3000,
        success: function (response){
          if(response.foundMessageId){
              var arr = response.foundMessageId;
              $('#prevMessage-div').removeClass('nodisplay');
              if($('#load-prevMsgs-btn').val() != ''){
                $('#load-prevMsgs-btn').val(arr.concat($('#load-prevMsgs-btn').val()));
                $('#prevMsgs-div').prepend(load_prevClubMsgs_template(response));
              } else{
                $('#load-prevMsgs-btn').val(arr);
              }
            } else{
              $('#load-prevMsgs-btn').addClass('nodisplay');
            }
          $('#load-prevMsgs-btn').html('<span id="load-prevMsgs-span"></span>LOAD PREV').blur();
        }
      });
    } else{
      $('#load-prevMsgs-btn').addClass('nodisplay');
    }
  }
});

function load_prevMsgs_template(response){
  html = ejs.render(`
<% var prevDate, prevAuthorId; %>
<% messageBucket.messages.forEach(function(message){ %>
  <% if(moment(message.createdAt).format("MMM Do YY") != prevDate){ %>
    <div class="chat-head3"><%= moment(message.createdAt).format("MMM Do YY") %></div>
  <% } %>
  <% if(message.authorId == currentUser){ %>
    <% if(prevAuthorId != message.authorId || moment(message.createdAt).format("MMM Do YY") != prevDate){ %>
      <div class="flex-end"><div class="chat-msg2"><div class="chat-msg-div"><%= message.text %></div><div class="chat-head2">
      <%= moment(message.createdAt).format('LT') %></div></div></div>
    <% } else{ %>
      <div class="flex-end"><div class="chat-msg2" style="border-radius: 0.5rem 0.375rem 0.5rem 0.5rem;">
      <div class="chat-msg-div"><%= message.text %></div><div class="chat-head2">
      <%= moment(message.createdAt).format('LT') %></div></div></div>
    <% } %>
  <% } else{ %>
    <% if(prevAuthorId != message.authorId || moment(message.createdAt).format("MMM Do YY") != prevDate){ %>
      <div><div class="chat-msg"><div class="chat-msg-div"><%= message.text %></div><div class="chat-head">
      <%= moment(message.createdAt).format('LT') %></div></div></div>
    <% } else{ %>
      <div><div class="chat-msg" style="border-radius: 0.375rem 0.5rem 0.5rem 0.5rem;">
      <div class="chat-msg-div"><%= message.text %></div><div class="chat-head">
      <%= moment(message.createdAt).format('LT') %></div></div></div>
    <% } %>
  <% } %>
  <% prevDate = moment(message.createdAt).format("MMM Do YY"); %>
  <% prevAuthorId = message.authorId; %>
<% }); %>
`,{messageBucket: response.messageBucket, currentUser: response.currentUser});
  return html;
}

function load_prevClubMsgs_template(response){
  html = ejs.render(`
<% var prevDate, prevAuthorId; %>
<% messageBucket.messages.forEach(function(message){ %>
  <% if(moment(message.createdAt).format("MMM Do YY") != prevDate){ %>
    <div class="chat-head3"><%= moment(message.createdAt).format("MMM Do YY") %></div>
  <% } %>
  <% if(message.authorId._id == currentUser){ %>
    <% if(prevAuthorId != message.authorId._id || moment(message.createdAt).format("MMM Do YY") != prevDate){ %>
      <div class="flex-end"><div class="chat-msg2"><div class="chat-head2 chat-head-clubpad"><%= firstName %>
      <%= moment(message.createdAt).format('LT') %></div><div class="clubchat-msg-div"><%= message.text %></div> </div></div>
    <% } else{ %>
      <div class="flex-end"><div class="chat-msg2" style="border-radius: 0.5rem 0.375rem 0.5rem 0.5rem;">
      <div class="chat-head2 chat-head-clubpad"><%= firstName %>
      <%= moment(message.createdAt).format('LT') %></div><div class="clubchat-msg-div"><%= message.text %></div> </div></div>
    <% } %>
  <% } else{ %>
    <% if(prevAuthorId != message.authorId._id || moment(message.createdAt).format("MMM Do YY") != prevDate){ %>
      <div class="d-flex flex-row"><div class="px-1">
      <img class="chatdp rounded-circle" src="<%= message.authorId.profilePic50 %>"></div>
      <div><div class="chat-msg"><div class="chat-head chat-head-clubpad bluecolor"><span class="text-xs"><%= message.authorName %></span>
      <%= moment(message.createdAt).format('LT') %></div><div class="clubchat-msg-div"><%= message.text %></div> </div></div></div>
    <% } else{ %>
      <div class="d-flex flex-row"><div class="px-1">
      <img class="chatdp rounded-circle transparent2" src="<%= message.authorId.profilePic50 %>"></div>
      <div><div class="chat-msg" style="border-radius: 0.375rem 0.5rem 0.5rem 0.5rem;"><div class="chat-head chat-head-clubpad bluecolor"><span class="text-xs"><%= message.authorName %></span>
      <%= moment(message.createdAt).format('LT') %></div><div class="clubchat-msg-div"><%= message.text %></div> </div></div></div>
    <% } %>
  <% } %>
  <% prevDate = moment(message.createdAt).format("MMM Do YY"); %>
  <% prevAuthorId = message.authorId._id; %>
<% }); %>
`,{messageBucket: response.messageBucket, currentUser: response.currentUser, firstName: response.firstName});
  return html;
}

function index_posts_template(response){
  html = ejs.render(`
<% var len = posts.length; var k=0; for(k;k<len;k++){ %>
  <!-- SIMPLE POSTS -->
  <% if(posts[k].topic == ''){ %>
    <div class="card post-head">
      <div class="card-body">
        <div class="dropctn">
          <div class="valign">
            <div>
              <% if(!friendsPostUrl){ %>
                <a href="/clubs/<%= posts[k].postClub._id %>"><img class="navdp rounded-circle mr-2" src="<%= PC_50_clubAvatar[k] || '/images/noClub.png' %>"></a>
              <% } else{ %>
                <a href="/users/<%= posts[k].postAuthor.id._id %>">
                  <% if(posts[k].postAuthor.id.userKeys.sex == 'Male'){ %>
                    <img class="navdp rounded-circle mr-2" src="<%= PA_50_profilePic[k] || '/images/noUserMale.png' %>">
                  <% } else if(posts[k].postAuthor.id.userKeys.sex == 'Female'){ %>
                    <img class="navdp rounded-circle mr-2" src="<%= PA_50_profilePic[k] || '/images/noUserFemale.png' %>">
                  <% } %>
                </a>
              <% } %>
            </div>
            <div>
              <div>
                <% if(!friendsPostUrl){ %>
                  <span class="mobiletext2">
                    <a href="/clubs/<%= posts[k].postClub._id %>" class="darkgrey"><strong><%= posts[k].postClub.name %></strong></a>
                  </span>
                <% } else{ %>
                  <span class="mobiletext2">
                    <a class="darkgrey" href="/users/<%= posts[k].postAuthor.id._id %>"><strong><%= posts[k].postAuthor.id.fullName %></strong></a>
                  </span>
                <% } %>
              </div>
            </div>
          </div>
          <% if(currentUser){ %>
            <div class="dropdown">
              <button class="btn btn-sm dropdown-toggle editprofile" type="button" data-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
              <ul class="dropdown-menu dropdown-menu-right dropbox">
                <div class="container drop-shadow1">
                  <li><a class="dropitems text-sm" href="#">Help ?</a></li>
                  <% if(currentUser._id == posts[k].postAuthor.id){ %>
                    <hr>
                    <li>
                      <button class="dropitems link-button text-sm red" href="#delPostModalclubs<%= posts[k].postClub._id %>posts<%= posts[k]._id %>" data-toggle="modal">Delete post</button>
                    </li>
                  <% } %>
                </div>
              </ul>
              <% if(currentUser._id == posts[k].postAuthor.id){ %>
                <div id="delPostModalclubs<%= posts[k].postClub._id %>posts<%= posts[k]._id %>" class="fixed-padding modal fade">
                  <div class="modal-dialog modal-confirm">
                    <div class="modal-content">
                      <div class="d-flex">
                        <span class="icon-box">
                          <i class="fas fa-exclamation-triangle text-xxxl"></i>
                        </span>              
                        <span class="my-auto"><h5 class="modal-title">Are you sure?</h5></span>
                        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                      </div>
                      <div>
                        <p>Do you really want to delete this post? This cannot be undone.</p>
                      </div>
                      <div class="my-2">
                        <button type="button" class="btn btn-secondary btn-sm mr-1" data-dismiss="modal">Cancel</button>
                        <form class="delete-form inline" action="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>?_method=DELETE" method="POST">
                          <button class="btn btn-danger btn-sm ml-1" type="submit">Delete</button>
                          <input type="hidden" name="_csrf" value="<%= csrfToken %>">
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              <% } %>
            </div>
          <% } %>
        </div>
      </div>
      <% if(posts[k].image){ %>
        <% if(!friendsPostUrl){ %>
          <a href="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>">
        <% } else{ %>
          <a href="/clubs/<%= posts[k].postClub %>/posts/<%= posts[k]._id %>">
        <% } %>
          <div class="postimgpad"><div class="postimgcorner"><img class="card-img-top postimg" src="<%= posts[k].image %>"></div></div>
        </a>
        <div class="card-body">
          <p class="truncate nothing mobiletext linewrap"><%= posts[k].description %></p>
          <em class="nothing mobiletext linewrap"><a href="<%= decodeURI(posts[k].hyperlink) %>" target="_blank" rel="noopener" class="truncate1"><%= decodeURI(posts[k].hyperlink) %></a></em>
          <div class="lightgrey2">
            <span>
              <em class="text-xxs"><%= moment(posts[k].createdAt).fromNow() %></em>
            </span>
            <% if(posts[k].commentsCount > 0){ %>
               . <span class="boldtext nothing text-xxs">
                <%= posts[k].commentsCount %><% if(posts[k].commentsCount == 1){ %> <i class="fas fa-comment"></i> <% } else{ %> <i class="fas fa-comments"></i> <% } %>
              </span>
            <% } %>
          </div>
        </div>
        <hr class="hr-light mx-2">
      <% } else{ %>
        <div class="card-body2 nounderline nothing">
          <% if(!friendsPostUrl){ %>
            <a href="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>">
          <% } else{ %>
            <a href="/clubs/<%= posts[k].postClub %>/posts/<%= posts[k]._id %>">
          <% } %>
          <% if(posts[k].description.length < 200){ %>
            <p class="truncate2 nothing mobiletext linewrap nolink description-short"><%= posts[k].description %></p>
          <% } else{ %>
            <p class="truncate2 nothing mobiletext linewrap nolink"><%= posts[k].description %></p>
          <% } %>
            <em class="nothing mobiletext linewrap"><a href="<%= decodeURI(posts[k].hyperlink) %>" target="_blank" rel="noopener" class="truncate1"><%= decodeURI(posts[k].hyperlink) %></a></em>
            <div class="lightgrey2">
              <span>
                <em class="text-xxs"><%= moment(posts[k].createdAt).fromNow() %></em>
              </span>
              <% if(posts[k].commentsCount > 0){ %>
                 . <span class="boldtext nothing text-xxs">
                  <%= posts[k].commentsCount %><% if(posts[k].commentsCount == 1){ %> <i class="fas fa-comment"></i> <% } else{ %> <i class="fas fa-comments"></i> <% } %>
                </span>
              <% } %>
            </div>
          </a>
        </div>
        <hr class="hr-light mx-2">
      <% } %>
      <div class="card-body3">
        <form class="valign" action="/posts/<%= posts[k]._id %>/vote" method="POST">
          <div class="valign">
            <% if(currentUser){ %>
              <% if(hasVote[k] == 1){ %>
                <span class="d-flex mr-1"> 
                  <button id="like-btn<%= posts[k]._id %>" class="vote likebtn" name="like" type="submit" value="like" title="Like"><i class="fas fa-thumbs-up greencolor"></i></button>
                </span>
                <span id="like-count<%= posts[k]._id %>" class="boldtext darkgrey nothing text-sm greencolor3"><%= posts[k].likeCount %></span>
              <% } else if(hasVote[k] == 0 || hasVote[k] == 3){ %>
                <span class="d-flex mr-1"> 
                  <button id="like-btn<%= posts[k]._id %>" class="vote likebtn" name="like" type="submit" value="like" title="Like"><i class="far fa-thumbs-up"></i></button>
                </span>
                <span id="like-count<%= posts[k]._id %>" class="nodisplay boldtext darkgrey nothing text-sm"><%= posts[k].likeCount %></span>
              <% } %>
            <% }else{ %>
              <span class="d-flex mr-1"> 
                <button id="like-btn<%= posts[k]._id %>" class="vote" name="like" type="submit" value="like" title="Like"><i class="fas fa-thumbs-up"></i></button>
              </span>
              <span id="like-count<%= posts[k]._id %>" class="nodisplay boldtext darkgrey nothing text-sm"><%= posts[k].likeCount %></span>
            <% } %>
          </div>
        
          <div class="valign">
            <% if(currentUser){ %>
              <% if(hasVote[k] == 3){ %>
                <span id="heart-count<%= posts[k]._id %>" class="boldtext darkgrey nothing text-sm redcolor3"><%= posts[k].heartCount %></span>
                <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart redcolor2"></i></button></span>
              <% } else if(hasVote[k] == 0 || hasVote[k] == 1){ %>
                <span id="heart-count<%= posts[k]._id %>" class="nodisplay boldtext darkgrey nothing text-sm"><%= posts[k].heartCount %></span>
                <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart"></i></button></span>
                <% } %>
            <% }else{ %>
              <span id="heart-count<%= posts[k]._id %>" class="nodisplay boldtext darkgrey nothing text-sm"><%= posts[k].heartCount %></span>
              <span><button id="heart-btn<%= posts[k]._id %>" class="vote" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart"></i></button></span>
            <% } %>
          </div>
          <input type="hidden" name="_csrf" value="<%= csrfToken %>">
        </form>
      </div>
    </div>
    <!-- COMMENTS -->
    <div class="mt-1"></div>
    <div class="card m-0 post-tail">
      <% if(posts[k].commentsCount != 0){ %>
        <div class="card-body3">
          <% var z=1; var buckets = posts[k].commentBuckets; var len1 = buckets.length; var i; for(i=len1-1;i>=0;i--){ %>
            <% var comments = buckets[i].comments; var len2 = comments.length; var j; for(j=len2-1;j>=0;j--){%>
            <% if(z<=2){ %>
              <div class="valign">
                <div class="wordwrap lineheight my-15">
                  <span><a href="/users/<%= comments[j].commentAuthor.id %>" class="black"><span class="nothing mobiletext boldtext"><%= comments[j].commentAuthor.authorName %></span></a>
                  </span>
                  <span class="mobiletext"><%= comments[j].text %></span>
                </div>
              </div>
            <% z++;} %>
            <% } %>
          <% } %>
        </div>
      <% } %>
      <div class="card-body3">
        <div class="commentdiv">
          <form action="/posts/<%= posts[k]._id %>/comments" method="POST">
            <div class="input-group">
              <input onclick="block_display('commentbtn<%= posts[k]._id %>');" id="commentbox<%= posts[k]._id %>" class="commentbox text-sm form-control form-control-sm" type="text" name="text" placeholder="Write a comment" required>
            </div>
            <div class="d-flex flex-row-reverse">
              <button class="btn btn-sm btn-success commentbtn commentbtn<%= posts[k]._id %> btnxs ml-2 mt-2">Submit</button>
              <button onclick="none_display('commentbtn<%= posts[k]._id %>')" class="btn btn-secondary commentbtn commentbtn<%= posts[k]._id %> btnxs text-sm mt-2" type="button">Cancel</button>
            </div>
            <input type="hidden" name="_csrf" value="<%= csrfToken %>">
          </form>
        </div>
      </div>
    </div>
  <% } else{ %>
    <!-- TOPIC POSTS -->
    <div class="d-flex flex-row justify-content-between">
      <div class="card topic-break mt-3 flex-column justify-content-between">
        <div>
          <div class="card-body">
            <div class="dropctn">
              <div class="valign">
                <div>
                  <% if(!friendsPostUrl){ %>
                    <a href="/clubs/<%= posts[k].postClub._id %>"><img class="navdp rounded-circle mr-2" src="<%= PC_50_clubAvatar[k] || '/images/noClub.png' %>"></a>
                  <% } else{ %>
                    <a href="/users/<%= posts[k].postAuthor.id._id %>">
                      <% if(posts[k].postAuthor.id.userKeys.sex == 'Male'){ %>
                        <img class="navdp rounded-circle mr-2" src="<%= PA_50_profilePic[k] || '/images/noUserMale.png' %>">
                      <% } else if(posts[k].postAuthor.id.userKeys.sex == 'Female'){ %>
                        <img class="navdp rounded-circle mr-2" src="<%= PA_50_profilePic[k] || '/images/noUserFemale.png' %>">
                      <% } %>
                    </a>
                  <% } %>
                </div>
                <div>
                  <div>
                    <% if(!friendsPostUrl){ %>
                      <span class="mobiletext2">
                        <a href="/clubs/<%= posts[k].postClub._id %>" class="darkgrey"><strong><%= posts[k].postClub.name %></strong></a>
                      </span>
                    <% } else{ %>
                      <span class="mobiletext2">
                        <a class="darkgrey" href="/users/<%= posts[k].postAuthor.id._id %>"><strong><%= posts[k].postAuthor.id.fullName %></strong></a>
                      </span>
                    <% } %>
                    <em class="text-xxs lightgrey2">. <%= moment(posts[k].createdAt).fromNow() %></em>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <% if(!friendsPostUrl){ %>
            <a href="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>" style="text-decoration: none;">
          <% } else{ %>
            <a href="/clubs/<%= posts[k].postClub %>/posts/<%= posts[k]._id %>" style="text-decoration: none;">
          <% } %>
            <div class="topic-head">
              <div class="px-2 mb-auto">
                <h5 class="nothing topic-h5"><%= posts[k].topic %></h5>
              </div>
            </div>
          </a>
        </div>
        <div>
          <div class="nounderline nothing">
            <% if(posts[k].image){ %>
              <div class="truncate nothing mobiletext linewrap card-body3"><%= posts[k].description %></div>
              <% if(posts[k].hyperlink && posts[k].hyperlink != ''){ %>
                <div class="card-body3"><em class="nothing mobiletext linewrap"><a href="<%= decodeURI(posts[k].hyperlink) %>" target="_blank" rel="noopener" class="truncate1"><%= decodeURI(posts[k].hyperlink) %></a></em></div>
              <% } %>
              <% if(!friendsPostUrl){ %>
                <a href="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>">
              <% } else{ %>
                <a href="/clubs/<%= posts[k].postClub %>/posts/<%= posts[k]._id %>">
              <% } %>
                <div class="topicimgpad"><div class="postimgcorner"><img class="card-img-top postimg topicimg" src="<%= posts[k].image %>"></div></div>
              </a>
            <% } else{ %>
              <% if(!friendsPostUrl){ %>
                <a href="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>">
              <% } else{ %>
                <a href="/clubs/<%= posts[k].postClub %>/posts/<%= posts[k]._id %>">
              <% } %>
                <div class="truncate2 card-body3 mobiletext linewrap nolink"><%= posts[k].description %></div>
                <% if(posts[k].hyperlink && posts[k].hyperlink != ''){ %>
                  <div class="card-body3"><em class="nothing mobiletext linewrap"><a href="<%= decodeURI(posts[k].hyperlink) %>" target="_blank" rel="noopener" class="truncate1"><%= decodeURI(posts[k].hyperlink) %></a></em></div>
                <% } %>
              </a>
            <% } %>
          </div>
          <% if(posts[k].subpostsCount > 0){ %>
            <div class="card-body5">
              <% if(!posts[k].image){ %>
                <hr class="hr-light">
              <% } %>
              <div>
                <span class="lightgrey2 text-xs"><strong><%= posts[k].subpostsCount %></strong> <i class="fas fa-comment-alt"></i></span>
              </div>
            </div>
          <% } %>
        </div>
      </div>
      <!-- TOPIC COLUMN -->
      <div class="d-flex flex-column topic-column mt-3">
        <div class="d-flex flex-column mb-auto">
          <div class="mx-auto my-2 py-1">
            <% if(currentUser){ %>
              <div class="dropdown">
                <button class="btn btn-sm dropdown-toggle editprofile" type="button" data-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
                <ul class="dropdown-menu dropdown-menu-right dropbox">
                  <div class="container drop-shadow1">
                    <li><a class="dropitems text-sm" href="#">Help ?</a></li>
                    <% if(currentUser._id == posts[k].postAuthor.id){ %>
                      <hr>
                      <li>
                        <button class="dropitems link-button text-sm red" href="#delPostModalclubs<%= posts[k].postClub._id %>posts<%= posts[k]._id %>" data-toggle="modal">Delete post</button>
                      </li>
                    <% } %>
                  </div>
                </ul>
                <% if(currentUser._id == posts[k].postAuthor.id){ %>
                  <div id="delPostModalclubs<%= posts[k].postClub._id %>posts<%= posts[k]._id %>" class="fixed-padding modal fade">
                    <div class="modal-dialog modal-confirm">
                      <div class="modal-content">
                        <div class="d-flex">
                          <span class="icon-box">
                            <i class="fas fa-exclamation-triangle text-xxxl"></i>
                          </span>              
                          <span class="my-auto"><h5 class="modal-title">Are you sure?</h5></span>
                          <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                        </div>
                        <div>
                          <p>Do you really want to delete this post? This cannot be undone.</p>
                        </div>
                        <div class="my-2">
                          <button type="button" class="btn btn-secondary btn-sm mr-1" data-dismiss="modal">Cancel</button>
                          <form class="delete-form inline" action="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>?_method=DELETE" method="POST">
                            <button class="btn btn-danger btn-sm ml-1" type="submit">Delete</button>
                            <input type="hidden" name="_csrf" value="<%= csrfToken %>">
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                <% } %>
              </div>
            <% } %>
          </div>
          <div style="margin-top: -1rem; margin-bottom: -0.5rem;">
            <div class="mx-2 mb-auto d-flex flex-column">
              <form class="d-flex flex-column post-modvote-form" action="/posts/<%= posts[k]._id %>/modvote" method="POST">
                <% if(hasModVote[k] == 1){%>
                  <button id="upVote-btn<%= posts[k]._id %>" class="modvote upVotebtn bluecolor on" name="upVote" type="submit" value="up" title="Upvote"><i class="fas fa-caret-up"></i></button>
                  <span id="modVote-count<%= posts[k]._id %>" class="modvote-count boldtext nothing text-xs text-center bluecolor3"><%= posts[k].upVoteCount - posts[k].downVoteCount %></span>
                  <button id="downVote-btn<%= posts[k]._id %>" class="modvote downVotebtn" name="downVote" type="submit" value="down" title="Downvote"><i class="fas fa-caret-down"></i></button>
                <% } else if(hasModVote[k] == -1){ %>
                  <button id="upVote-btn<%= posts[k]._id %>" class="modvote upVotebtn" name="upVote" type="submit" value="up" title="Upvote"><i class="fas fa-caret-up"></i></button>
                  <span id="modVote-count<%= posts[k]._id %>" class="modvote-count boldtext nothing text-xs text-center orangecolor"><%= posts[k].upVoteCount - posts[k].downVoteCount %></span>
                  <button id="downVote-btn<%= posts[k]._id %>" class="modvote downVotebtn orangecolor on" name="downVote" type="submit" value="down" title="Downvote"><i class="fas fa-caret-down"></i></button>
                <% } else if(hasModVote[k] == 0){ %>
                  <button id="upVote-btn<%= posts[k]._id %>" class="modvote upVotebtn" name="upVote" type="submit" value="up" title="Upvote"><i class="fas fa-caret-up"></i></button>
                  <span id="modVote-count<%= posts[k]._id %>" class="modvote-count boldtext darkgrey nothing text-xs text-center"><%= posts[k].upVoteCount - posts[k].downVoteCount %></span>
                  <button id="downVote-btn<%= posts[k]._id %>" class="modvote downVotebtn" name="downVote" type="submit" value="down" title="Downvote"><i class="fas fa-caret-down"></i></button>
                <% } %>
                <input type="hidden" name="_csrf" value="<%= csrfToken %>">
              </form>
            </div>
          </div>
        </div>
        <div>
          <form action="/posts/<%= posts[k]._id %>/vote" method="POST">
            <div class="d-flex flex-column">
              <% if(currentUser){ %>
                <% if(hasVote[k] == 3){ %>
                  <div id="heart-count<%= posts[k]._id %>" class="boldtext darkgrey nothing text-sm redcolor3 mx-auto topic-heart mt-2"><%= posts[k].heartCount %></div>
                  <div class="mx-auto pb-1"><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart redcolor2"></i></button></div>
                <% } else if(hasVote[k] == 0){ %>
                  <div id="heart-count<%= posts[k]._id %>" class="nodisplay boldtext darkgrey nothing text-sm mx-auto topic-heart mt-2"><%= posts[k].heartCount %></div>
                  <div class="mx-auto pb-1"><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart"></i></button></div>
                  <% } %>
                    <div class="nodisplay" id="modVisibility<%= posts[k]._id %>"></div>
              <% } else{ %>
                <div class="mx-auto pb-1"><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart"></i></button></div>
              <% } %>
            </div>
            <input type="hidden" name="_csrf" value="<%= csrfToken %>">
          </form>
        </div>
      </div>
    </div>
  <% } %>
<% } %>
`,{hasVote: response.hasVote, hasModVote: response.hasModVote, posts: response.posts,
  friendsPostUrl: response.friendsPostUrl, currentUser: response.currentUser, 
  CU_50_profilePic: response.CU_50_profilePic, PC_50_clubAvatar: response.PC_50_clubAvatar, 
  PA_50_profilePic: response.PA_50_profilePic, csrfToken: response.csrfToken});
  return html;
}

function discover_posts_template(response){
  html = ejs.render(`
<% var len = posts.length; var k=0; for(k;k<len;k++){ %>
  <!-- SIMPLE POSTS -->
  <% if(posts[k].topic == ''){ %>
    <div id="votecard<%= posts[k]._id %>" class="discover-overlay">
      <div class="discovertop-left lineheight2">
        <% if(posts[k].commentsCount > 0){ %>
          <span class="boldtext">
            <%= posts[k].commentsCount %><% if(posts[k].commentsCount == 1){ %> <i class="fas fa-comment"></i> <% } else{ %> <i class="fas fa-comments"></i> <% } %>
          </span>
        <% } %>
      </div>
      <% if(posts[k].hyperlink && posts[k].hyperlink != ''){ %>
        <div class="discovertop-left discoverlink lineheight2">
          <a style="padding: 0 !important;" target="_blank" rel="noopener" href="<%= decodeURI(posts[k].hyperlink) %>"><i class="fas fa-link text-index mobiletext4"></i></a>
        </div>
      <% } %>
      <div class="discovertop lineheight2 boldtext">
        <a href="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>" id="viewbtn<%= posts[k]._id %>"><span class="text-xxxl arrowshowpost">&gt;</span></a>
      </div>
      <div class="overlay-content">
        <div>
          <form class="d-flex justify-content-around" action="/posts/<%= posts[k]._id %>/vote" method="POST">
            <div class="valign">
              <% if(currentUser){ %>
                <% if(hasVote[k] == 1){ %>
                  <span class="d-flex mr-1"> 
                    <button id="like-btn<%= posts[k]._id %>" class="vote likebtn" name="like" type="submit" value="like" title="Like"><i class="fas fa-thumbs-up discover-vote greencolor"></i></button>
                  </span>
                  <span id="like-count<%= posts[k]._id %>" class="boldtext whitecolor nothing text-sm mobiletext3 greencolor2"><%= posts[k].likeCount %></span>
                <% } else if(hasVote[k] == 0 || hasVote[k] == 3){ %>
                  <span class="d-flex mr-1"> 
                    <button id="like-btn<%= posts[k]._id %>" class="vote likebtn" name="like" type="submit" value="like" title="Like"><i class="far fa-thumbs-up discover-vote"></i></button>
                  </span>
                  <span id="like-count<%= posts[k]._id %>" class="boldtext whitecolor nothing text-sm mobiletext3"><%= posts[k].likeCount %></span>
                <% } %>
              <% }else{ %>
                <span class="d-flex mr-1"> 
                  <button id="like-btn<%= posts[k]._id %>" class="vote" name="like" type="submit" value="like" title="Like"><i class="fas fa-thumbs-up discover-vote"></i></button>
                </span>
                <span id="like-count<%= posts[k]._id %>" class="boldtext whitecolor nothing text-sm mobiletext3"><%= posts[k].likeCount %></span>
              <% } %>
            </div>
          
            <div class="valign">
              <% if(currentUser){ %>
                <% if(hasVote[k] == 3){ %>
                  <span id="heart-count<%= posts[k]._id %>" class="boldtext darkgrey nothing text-sm mobiletext3 redcolor2"><%= posts[k].heartCount %></span>
                  <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart discover-vote redcolor2"></i></button></span>
                <% } else if(hasVote[k] == 0 || hasVote[k] == 1){ %>
                  <span id="heart-count<%= posts[k]._id %>" class="boldtext whitecolor nothing text-sm mobiletext3"><%= posts[k].heartCount %></span>
                  <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart discover-vote"></i></button></span>
                  <% } %>
              <% }else{ %>
                <span id="heart-count<%= posts[k]._id %>" class="boldtext whitecolor nothing text-sm mobiletext3"><%= posts[k].heartCount %></span>
                <span><button id="heart-btn<%= posts[k]._id %>" class="vote" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart discover-vote"></i></button></span>
              <% } %>
            </div>
            <input type="hidden" name="_csrf" value="<%= csrfToken %>">
          </form>
        </div>
      </div>
    </div>
    <div id="discovercard<%= posts[k]._id %>" class="card discovercard">
      <div class="card-body">
        <div class="dropctn">
          <div class="valign">
            <div>
              <span><img class="navdp discoverdp rounded-circle mr-2" src="<%= PC_50_clubAvatar[k] || '/images/noClub.png' %>"></span>
            </div>
            <div>
              <div>
                <span class="mobiletext3">
                  <span class="darkgrey truncate1"><strong><%= posts[k].postClub.name %></strong></span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <% if(posts[k].image){ %>
        <span>
          <div><img class="card-img-top postimg topicimg" src="<%= posts[k].image %>"></div>
        </span>
        <div class="card-body">
          <p class="truncate nothing mobiletext linewrap"><%= posts[k].description %></p>
          <em class="nothing mobiletext linewrap"><span class="truncate1"><%= decodeURI(posts[k].hyperlink) %></span></em>
        </div>
      <% } else{ %>
        <div class="card-body2 nounderline nothing">
          <span>
            <p class="truncate2 nothing mobiletext linewrap nolink"><%= posts[k].description %></p>
            <em class="nothing mobiletext linewrap"><span class="truncate1"><%= decodeURI(posts[k].hyperlink) %></span></em>
          </span>
        </div>
      <% } %>
    </div>
  <% } %>
<% } %>
`,{hasVote: response.hasVote, hasModVote: response.hasModVote, posts: response.posts,
  currentUser: response.currentUser, CU_50_profilePic: response.CU_50_profilePic,
  PC_50_clubAvatar: response.PC_50_clubAvatar, PA_50_profilePic: response.PA_50_profilePic, 
  csrfToken: response.csrfToken});
  return html;
}

function club_posts_template(response){
  html = ejs.render(`
<% var len = posts.length; var k=0; for(k;k<len;k++){ %>
  <!-- SIMPLE POSTS -->
  <% if(posts[k].topic == ''){ %>
    <div class="card post-head">
      <div class="card-body">
        <div class="dropctn">
          <div class="valign">
            <div>
              <a href="/users/<%= posts[k].postAuthor.id._id %>">
                <% if(posts[k].postAuthor.id.userKeys.sex == 'Male'){ %>
                  <img class="navdp rounded-circle mr-2" src="<%= PA_50_profilePic[k] || '/images/noUserMale.png' %>">
                <% } else if(posts[k].postAuthor.id.userKeys.sex == 'Female'){ %>
                  <img class="navdp rounded-circle mr-2" src="<%= PA_50_profilePic[k] || '/images/noUserFemale.png' %>">
                <% } %>
              </a>
            </div>
            <div class="lineheight2">
              <div>
                <span class="mobiletext2">
                  <a href="/users/<%= posts[k].postAuthor.id._id %>" class="darkgrey"><strong><%= posts[k].postAuthor.id.fullName %></strong></a>
                </span>
              </div>
              <div>
              <% if(0 <= rank && rank <= 2){ %>
                <div id="priv-badge<%= posts[k]._id %>" class="priv-badge badge badge-light text-xxs"><%= privacyText(posts[k].privacy) %></div>
              <% } %>
              <% if(0 <= rank && rank <= 2 && 0 <= posts[k].moderation && posts[k].moderation <= 1){ %>
                <div id="mod-badge<%= posts[k]._id %>" class="mod-badge badge badge-light text-xxs"><%= posts[k].moderation %></div>
              <% } else if(posts[k].moderation == -1){ %>
                <div id="mod-badge<%= posts[k]._id %>" class="mod-badge badge badge-danger text-xxs"><%= posts[k].moderation %></div>
              <% } %>
              <% if(posts[k].descEdit.length != 0){ %>
                <div class="badge badge-warning text-xxs">Edited</div>
              <% } %>
              </div>
            </div>
          </div>
          <% if(currentUser){ %>
            <div class="dropdown">
              <button class="btn btn-sm dropdown-toggle" type="button" data-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
              <ul class="dropdown-menu dropdown-menu-right dropbox">
                <div class="container drop-shadow1">
                  <% if(0 <= rank && rank <= 1){ %>
                    <li>
                      <form class="valign" action="/posts/<%= posts[k]._id %>/vote" method="POST">
                        <% if(posts[k].moderation != -1){ %>
                          <button id="visibility<%= posts[k]._id %>" class="dropitems link-button moderation text-sm" name="visibility" value="-1" title="Post moderation" type="submit">Visibility(Hide)</button>
                        <% } else if(posts[k].moderation == -1){ %>
                          <button id="visibility<%= posts[k]._id %>" class="dropitems link-button moderation text-sm" name="visibility" value="1" title="Post moderation" type="submit">Visibility(Show)</button>
                        <% } %>
                        <input type="hidden" name="_csrf" value="<%= csrfToken %>">
                      </form>
                    </li>
                  <% } %>
                  <li><a class="dropitems text-sm" href="#">Help ?</a></li>
                  <% if(currentUser._id == posts[k].postAuthor.id._id){ %>
                    <hr>
                    <li>
                      <button class="dropitems link-button text-sm red" href="#delPostModalclubs<%= posts[k].postClub %>posts<%= posts[k]._id %>" data-toggle="modal">Delete post</button>
                    </li>
                  <% } %>
                </div>
              </ul>
              <% if(currentUser._id == posts[k].postAuthor.id._id){ %>
                <div id="delPostModalclubs<%= posts[k].postClub %>posts<%= posts[k]._id %>" class="fixed-padding modal fade">
                  <div class="modal-dialog modal-confirm">
                    <div class="modal-content">
                      <div class="d-flex">
                        <span class="icon-box">
                          <i class="fas fa-exclamation-triangle text-xxxl"></i>
                        </span>              
                        <span class="my-auto"><h5 class="modal-title">Are you sure?</h5></span>
                        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                      </div>
                      <div>
                        <p>Do you really want to delete this post? This cannot be undone.</p>
                      </div>
                      <div class="my-2">
                        <button type="button" class="btn btn-secondary btn-sm mr-1" data-dismiss="modal">Cancel</button>
                        <form class="delete-form inline" action="/clubs/<%= posts[k].postClub %>/posts/<%= posts[k]._id %>?_method=DELETE" method="POST">
                          <button class="btn btn-danger btn-sm ml-1" type="submit">Delete</button>
                          <input type="hidden" name="_csrf" value="<%= csrfToken %>">
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              <% } %>
            </div>
          <% } %>
        </div>
      </div>
      <% if(posts[k].image){ %>
        <a href="/clubs/<%= posts[k].postClub %>/posts/<%= posts[k]._id %>">
          <div class="postimgpad"><div class="postimgcorner"><img class="card-img-top postimg" src="<%= posts[k].image %>"></div></div>
        </a>
        <div class="card-body">
          <p class="truncate nothing mobiletext linewrap"><%= posts[k].description %></p>
          <em class="nothing mobiletext linewrap"><a href="<%= decodeURI(posts[k].hyperlink) %>" target="_blank" rel="noopener" class="truncate1"><%= decodeURI(posts[k].hyperlink) %></a></em>
          <div class="lightgrey2 valign">
            <div>
              <span>
                <em class="text-xxs"><%= moment(posts[k].createdAt).calendar() %></em>
              </span>
              <% if(posts[k].commentsCount > 0){ %>
                . <span class="boldtext nothing text-xxs">
                  <%= posts[k].commentsCount %><% if(posts[k].commentsCount == 1){ %> <i class="fas fa-comment"></i> <% } else{ %> <i class="fas fa-comments"></i> <% } %>
                </span>
              <% } %>
            </div>
            <div>
              <form class="valign" action="/posts/<%= posts[k]._id %>/vote" method="POST">
                <!-- Moderation -->
                <% if(0 <= posts[k].privacy && posts[k].privacy <= 1){ %>
                  <% if((rank == 0 || rank == 2) && posts[k].moderation == 1){ %>
                    <span>
                      <button id="moderation<%= posts[k]._id %>" class="moderation btn btnxxs btn-light noshadow text-sm ml-2" name="published" value="0" title="Post moderation" type="submit">
                      </button>
                    </span>
                  <% } else if((rank == 0 || rank == 2) && posts[k].moderation == 0){ %>
                    <span>
                      <button id="moderation<%= posts[k]._id %>" class="moderation btn btnxxs btn-info noshadow text-sm ml-2" name="exclusive" value="1" title="Post moderation" type="submit">Published</button>
                    </span>
                  <% } %>
                <% } %>
                <input type="hidden" name="_csrf" value="<%= csrfToken %>">
              </form>
            </div>
          </div>
        </div>
        <hr class="hr-light mx-2">
      <% } else{ %>
        <div class="nounderline nothing card-body2">
          <a href="/clubs/<%= posts[k].postClub %>/posts/<%= posts[k]._id %>">
            <% if(posts[k].description.length < 200){ %>
              <span class="truncate2 mobiletext linewrap nolink description-short"><%= posts[k].description %></span>
            <% } else{ %>
              <span class="truncate2 mobiletext linewrap nolink"><%= posts[k].description %></span>
            <% } %>
            <em class="nothing mobiletext linewrap"><a href="<%= decodeURI(posts[k].hyperlink) %>" target="_blank" rel="noopener" class="truncate1"><%= decodeURI(posts[k].hyperlink) %></a></em>
            <div class="lightgrey2 valign">
              <div>
                <span>
                  <em class="text-xxs"><%= moment(posts[k].createdAt).calendar() %></em>
                </span>
                <% if(posts[k].commentsCount > 0){ %>
                  . <span class="boldtext nothing text-xxs">
                    <%= posts[k].commentsCount %><% if(posts[k].commentsCount == 1){ %> <i class="fas fa-comment"></i> <% } else{ %> <i class="fas fa-comments"></i> <% } %>
                  </span>
                <% } %>
              </div>
              <div>
                <form class="valign" action="/posts/<%= posts[k]._id %>/vote" method="POST">
                  <!-- Moderation -->
                  <% if(0 <= posts[k].privacy && posts[k].privacy <= 1){ %>
                    <% if((rank == 0 || rank == 2) && posts[k].moderation == 1){ %>
                      <span>
                        <button id="moderation<%= posts[k]._id %>" class="moderation btn btnxxs btn-light noshadow text-sm ml-2" name="published" value="0" title="Post moderation" type="submit">Exclusive</button>
                      </span>
                    <% } else if((rank == 0 || rank == 2) && posts[k].moderation == 0){ %>
                      <span>
                        <button id="moderation<%= posts[k]._id %>" class="moderation btn btnxxs btn-info noshadow text-sm ml-2" name="exclusive" value="1" title="Post moderation" type="submit">Published</button>
                      </span>
                    <% } %>
                  <% } %>
                  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
                </form>
              </div>
            </div>
          </a>
        </div>
        <hr class="hr-light mx-2">
      <% } %>
      <div class="card-body3">
        <form class="valign" action="/posts/<%= posts[k]._id %>/vote" method="POST">
          <div class="valign">
            <% if(currentUser){ %>
              <% if(hasVote[k] == 1){ %>
                <span class="d-flex mr-1"> 
                  <button id="like-btn<%= posts[k]._id %>" class="vote likebtn" name="like" type="submit" value="like" title="Like"><i class="fas fa-thumbs-up greencolor"></i></button>
                </span>
                <span id="like-count<%= posts[k]._id %>" class="boldtext darkgrey nothing text-sm greencolor3"><%= posts[k].likeCount %></span>
              <% } else if(hasVote[k] == 0 || hasVote[k] == 3){ %>
                <span class="d-flex mr-1"> 
                  <button id="like-btn<%= posts[k]._id %>" class="vote likebtn" name="like" type="submit" value="like" title="Like"><i class="far fa-thumbs-up"></i></button>
                </span>
                <span id="like-count<%= posts[k]._id %>" class="nodisplay boldtext darkgrey nothing text-sm"><%= posts[k].likeCount %></span>              <% } %>
            <% } else{ %>
              <span class="d-flex mr-1"> 
                <button id="like-btn<%= posts[k]._id %>" class="vote" name="like" type="submit" value="like" title="Like"><i class="fas fa-thumbs-up"></i></button>
              </span>
              <span id="like-count<%= posts[k]._id %>" class="nodisplay boldtext darkgrey nothing text-sm"><%= posts[k].likeCount %></span>            <% } %>
          </div>
        
          <div class="valign">
            <% if(currentUser){ %>
              <% if(hasVote[k] == 3){ %>
                <span id="heart-count<%= posts[k]._id %>" class="boldtext darkgrey nothing text-sm redcolor3"><%= posts[k].heartCount %></span>
                <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart redcolor2"></i></button></span>
              <% } else if(hasVote[k] == 0 || hasVote[k] == 1){ %>
                <span id="heart-count<%= posts[k]._id %>" class="nodisplay boldtext darkgrey nothing text-sm"><%= posts[k].heartCount %></span>
                <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart"></i></button></span>
                <% } %>
                <span class="nodisplay" id="modVisibility<%= posts[k]._id %>"></span>
            <% } else{ %>
              <span id="heart-count<%= posts[k]._id %>" class="nodisplay boldtext darkgrey nothing text-sm"><%= posts[k].heartCount %></span>
              <span><button id="heart-btn<%= posts[k]._id %>" class="vote" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart"></i></button></span>
            <% } %>
          </div>
          <input type="hidden" name="_csrf" value="<%= csrfToken %>">
        </form>
      </div>
    </div>
    <!-- COMMENTS -->
    <div class="mt-1"></div>
    <div class="card m-0 post-tail">
      <% if(posts[k].commentsCount != 0){ %>
        <div class="card-body3">
          <% var z=1; var buckets = posts[k].commentBuckets; var len1 = buckets.length; var i; for(i=len1-1;i>=0;i--){%>
            <% var comments = buckets[i].comments; var len2 = comments.length; var j; for(j=len2-1;j>=0;j--){%>
            <% if(z<=2){ %>
              <div class="valign">
                <div class="wordwrap lineheight my-15">
                  <span><a href="/users/<%= comments[j].commentAuthor.id %>" class="black"><span class="nothing mobiletext boldtext"><%= comments[j].commentAuthor.authorName %></span></a>
                  </span>
                  <span class="mobiletext"><%= comments[j].text %></span>
                </div>
              </div>
            <% z++;} %>
            <% } %>
          <% } %>
        </div>
      <% } %>
      <div class="card-body3">
        <div class="commentdiv">
          <form action="/posts/<%= posts[k]._id %>/comments" method="POST">
            <div class="input-group">
              <input onclick="block_display('commentbtn<%= posts[k]._id %>');" id="commentbox<%= posts[k]._id %>" class="commentbox text-sm form-control form-control-sm" type="text" name="text" placeholder="Write a comment" required>
            </div>
            <div class="d-flex flex-row-reverse">
              <button class="btn btn-sm btn-success commentbtn commentbtn<%= posts[k]._id %> btnxs ml-2 mt-2">Submit</button>
              <button onclick="none_display('commentbtn<%= posts[k]._id %>'); clear_text();" class="btn  btn-secondary commentbtn commentbtn<%= posts[k]._id %> btnxs text-sm mt-2" type="button">Cancel</button>
            </div>
            <input type="hidden" name="_csrf" value="<%= csrfToken %>">
          </form>
        </div>
      </div>
    </div>
  <% } else{ %>
    <!-- TOPIC POSTS -->
    <div class="noborder d-flex flex-row justify-content-between">
      <div class="card topic-break mt-3 flex-column justify-content-between">
        <div>
          <div class="card-body">
            <div class="dropctn">
              <div class="valign">
                <div>
                  <a href="/users/<%= posts[k].postAuthor.id._id %>">
                    <% if(posts[k].postAuthor.id.userKeys.sex == 'Male'){ %>
                      <img class="navdp rounded-circle mr-2" src="<%= PA_50_profilePic[k] || '/images/noUserMale.png' %>">
                    <% } else if(posts[k].postAuthor.id.userKeys.sex == 'Female'){ %>
                      <img class="navdp rounded-circle mr-2" src="<%= PA_50_profilePic[k] || '/images/noUserFemale.png' %>">
                    <% } %>
                  </a>
                </div>
                <div class="lineheight2">
                  <div>
                    <span class="mobiletext2">
                      <a href="/users/<%= posts[k].postAuthor.id._id %>" class="darkgrey"><strong><%= posts[k].postAuthor.id.fullName %></strong></a>
                    </span>
                    <em class="text-xxs lightgrey2">. <%= moment(posts[k].createdAt).calendar() %></em>
                  </div>
                  <div>
                  <% if(posts[k].moderation == -1){ %>
                    <div id="mod-badge<%= posts[k]._id %>" class="mod-badge badge badge-danger text-xxs"><%= posts[k].moderation %></div>
                  <% } %>
                  <% if(posts[k].descEdit.length != 0){ %>
                    <div class="badge badge-warning text-xxs">Edited</div>
                  <% } %>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <a href="/clubs/<%= posts[k].postClub %>/posts/<%= posts[k]._id %>" style="text-decoration: none;">
            <div class="valign topic-head">
              <div class="px-2 mb-auto">
                <h5 class="nothing topic-h5"><%= posts[k].topic %></h5>
              </div>
            </div>
          </a>
        </div>
        <div>
          <div class="nounderline nothing">
            <% if(posts[k].image){ %>
              <div class="truncate nothing mobiletext linewrap card-body3"><%= posts[k].description %></div>
              <% if(posts[k].hyperlink && posts[k].hyperlink != ''){ %>
                <div class="card-body3"><em class="nothing mobiletext linewrap"><a href="<%= decodeURI(posts[k].hyperlink) %>" target="_blank" rel="noopener" class="truncate1"><%= decodeURI(posts[k].hyperlink) %></a></em></div>
              <% } %>
                <a href="/clubs/<%= posts[k].postClub %>/posts/<%= posts[k]._id %>">
                <div class="topicimgpad"><div class="postimgcorner"><img class="card-img-top postimg topicimg" src="<%= posts[k].image %>"></div></div>
              </a>
            <% } else{ %>
              <a href="/clubs/<%= posts[k].postClub %>/posts/<%= posts[k]._id %>">
                <div class="truncate2 card-body3 mobiletext linewrap nolink"><%= posts[k].description %></div>
                <% if(posts[k].hyperlink && posts[k].hyperlink != ''){ %>
                  <div class="card-body3"><em class="nothing mobiletext linewrap"><a href="<%= decodeURI(posts[k].hyperlink) %>" target="_blank" rel="noopener" class="truncate1"><%= decodeURI(posts[k].hyperlink) %></a></em></div>
                <% } %>
              </a>
            <% } %>
          </div>
          <% if(posts[k].subpostsCount > 0){ %>
            <div class="card-body5">
              <% if(!posts[k].image){ %>
                <hr class="hr-light">
              <% } %>
              <div>
                <span class="lightgrey2 text-xs"><strong><%= posts[k].subpostsCount %></strong> <i class="fas fa-comment-alt"></i></span>
              </div>
            </div>
          <% } %>
        </div>
      </div>
      <!-- TOPIC COLUMN -->
      <div class="d-flex flex-column topic-column mt-3">
        <div class="d-flex flex-column mb-auto">
          <div class="mx-auto my-2 py-1">
            <% if(currentUser){ %>
              <div class="dropdown">
                <button class="btn btn-sm dropdown-toggle" type="button" data-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
                <ul class="dropdown-menu dropdown-menu-right dropbox">
                  <div class="container drop-shadow1">
                    <% if(0 <= rank && rank <= 1){ %>
                      <li>
                        <form class="valign" action="/posts/<%= posts[k]._id %>/vote" method="POST">
                          <% if(posts[k].moderation != -1){ %>
                            <button id="visibility<%= posts[k]._id %>" class="dropitems link-button moderation text-sm" name="visibility" value="-1" title="Post moderation" type="submit">Visibility(Hide)</button>
                          <% } else if(posts[k].moderation == -1){ %>
                            <button id="visibility<%= posts[k]._id %>" class="dropitems link-button moderation text-sm" name="visibility" value="1" title="Post moderation" type="submit">Visibility(Show)</button>
                          <% } %>
                          <input type="hidden" name="_csrf" value="<%= csrfToken %>">
                        </form>
                      </li>
                    <% } %>
                    <li><a class="dropitems text-sm" href="#">Help ?</a></li>
                    <% if(currentUser._id == posts[k].postAuthor.id._id){ %>
                      <hr>
                      <li>
                        <button class="dropitems link-button text-sm red" href="#delPostModalclubs<%= posts[k].postClub %>posts<%= posts[k]._id %>" data-toggle="modal">Delete post</button>
                      </li>
                    <% } %>
                  </div>
                </ul>
                <% if(currentUser._id == posts[k].postAuthor.id._id){ %>
                  <div id="delPostModalclubs<%= posts[k].postClub %>posts<%= posts[k]._id %>" class="fixed-padding modal fade">
                    <div class="modal-dialog modal-confirm">
                      <div class="modal-content">
                        <div class="d-flex">
                          <span class="icon-box">
                            <i class="fas fa-exclamation-triangle text-xxxl"></i>
                          </span>              
                          <span class="my-auto"><h5 class="modal-title">Are you sure?</h5></span>
                          <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                        </div>
                        <div>
                          <p>Do you really want to delete this post? This cannot be undone.</p>
                        </div>
                        <div class="my-2">
                          <button type="button" class="btn btn-secondary btn-sm mr-1" data-dismiss="modal">Cancel</button>
                          <form class="delete-form inline" action="/clubs/<%= posts[k].postClub %>/posts/<%= posts[k]._id %>?_method=DELETE" method="POST">
                            <button class="btn btn-danger btn-sm ml-1" type="submit">Delete</button>
                            <input type="hidden" name="_csrf" value="<%= csrfToken %>">
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                <% } %>
              </div>
            <% } %>
          </div>
          <div style="margin-top: -1rem; margin-bottom: -0.5rem;">
            <div class="mx-2 mb-auto d-flex flex-column">
              <form class="d-flex flex-column post-modvote-form" action="/posts/<%= posts[k]._id %>/modvote" method="POST">
                <% if(hasModVote[k] == 1){%>
                  <button id="upVote-btn<%= posts[k]._id %>" class="modvote upVotebtn bluecolor on" name="upVote" type="submit" value="up" title="Upvote"><i class="fas fa-caret-up"></i></button>
                  <span id="modVote-count<%= posts[k]._id %>" class="modvote-count boldtext nothing text-xs text-center bluecolor3"><%= posts[k].upVoteCount - posts[k].downVoteCount %></span>
                  <button id="downVote-btn<%= posts[k]._id %>" class="modvote downVotebtn" name="downVote" type="submit" value="down" title="Downvote"><i class="fas fa-caret-down"></i></button>
                <% } else if(hasModVote[k] == -1){ %>
                  <button id="upVote-btn<%= posts[k]._id %>" class="modvote upVotebtn" name="upVote" type="submit" value="up" title="Upvote"><i class="fas fa-caret-up"></i></button>
                  <span id="modVote-count<%= posts[k]._id %>" class="modvote-count boldtext nothing text-xs text-center orangecolor"><%= posts[k].upVoteCount - posts[k].downVoteCount %></span>
                  <button id="downVote-btn<%= posts[k]._id %>" class="modvote downVotebtn orangecolor on" name="downVote" type="submit" value="down" title="Downvote"><i class="fas fa-caret-down"></i></button>
                <% } else if(hasModVote[k] == 0){ %>
                  <button id="upVote-btn<%= posts[k]._id %>" class="modvote upVotebtn" name="upVote" type="submit" value="up" title="Upvote"><i class="fas fa-caret-up"></i></button>
                  <span id="modVote-count<%= posts[k]._id %>" class="modvote-count boldtext darkgrey nothing text-xs text-center"><%= posts[k].upVoteCount - posts[k].downVoteCount %></span>
                  <button id="downVote-btn<%= posts[k]._id %>" class="modvote downVotebtn" name="downVote" type="submit" value="down" title="Downvote"><i class="fas fa-caret-down"></i></button>
                <% } %>
                <input type="hidden" name="_csrf" value="<%= csrfToken %>">
              </form>
            </div>
          </div>
        </div>
        <div>
          <form action="/posts/<%= posts[k]._id %>/vote" method="POST">
            <div class="d-flex flex-column">
              <% if(currentUser){ %>
                <% if(hasVote[k] == 3){ %>
                  <div id="heart-count<%= posts[k]._id %>" class="boldtext darkgrey nothing text-sm redcolor3 mx-auto topic-heart mt-2"><%= posts[k].heartCount %></div>
                  <div class="mx-auto pb-1"><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart redcolor2"></i></button></div>
                <% } else if(hasVote[k] == 0){ %>
                  <div id="heart-count<%= posts[k]._id %>" class="nodisplay boldtext darkgrey nothing text-sm mx-auto topic-heart mt-2"><%= posts[k].heartCount %></div>
                  <div class="mx-auto pb-1"><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart"></i></button></div>
                  <% } %>
                    <div class="nodisplay" id="modVisibility<%= posts[k]._id %>"></div>
              <% } else{ %>
                <div class="mx-auto pb-1"><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart"></i></button></div>
              <% } %>
            </div>
            <input type="hidden" name="_csrf" value="<%= csrfToken %>">
          </form>
        </div>
      </div>
    </div>
  <% } %>
<% } %>

<%
function privacyText(privacy){
  if(privacy == 0){return 'Public';}
  else if(privacy == 1){return 'Friends';}
  else if(privacy == 2){return 'Club';}
  else if(privacy == 3){return 'Club(friends)';}
  else if(privacy == 4){return 'Private';}
} %>
`,{hasVote: response.hasVote, hasModVote: response.hasModVote, posts: response.posts, rank: response.rank,
  currentUser: response.currentUser, PA_50_profilePic: response.PA_50_profilePic, 
  CU_50_profilePic: response.CU_50_profilePic, csrfToken: response.csrfToken});
  return html;
}

function user_posts_template(response){
  html = ejs.render(`
<% var len = posts.length; var k=0; for(k;k<len;k++){ %>
  <!-- SIMPLE POSTS -->
  <% if(posts[k].topic == ''){ %>
    <% if(k == 0){ %>
      <div class="card mt-0 pt-3 post-head">
    <% } else{ %>
      <div class="card post-head">
    <% } %>
      <div class="card-body">
        <div class="dropctn">
          <div class="valign lineheight">
            <div>
              <a href="/clubs/<%= posts[k].postClub._id %>"><img class="navdp rounded-circle mr-2" src="<%= PC_50_clubAvatar[k] || '/images/noClub.png' %>"></a>
            </div>
            <div class="lineheight2">
              <div>
                <span class="mobiletext2">
                  <a href="/clubs/<%= posts[k].postClub._id %>" class="darkgrey"><strong><%= posts[k].postClub.name %></strong></a>
                </span>
              </div>
              <div>
                <% if(currentUser && match){ %>
                  <div class="badge badge-light text-xxs"><%= privacyText(posts[k].privacy) %></div>
                  <% if(0 <= posts[k].moderation && posts[k].moderation <= 1){ %>
                    <div id="mod-badge<%= posts[k]._id %>" class="mod-badge badge badge-light text-xxs"><%= posts[k].moderation %></div>
                  <% } else if(posts[k].moderation == -1){ %>
                    <div id="mod-badge<%= posts[k]._id %>" class="mod-badge badge badge-danger text-xxs"><%= posts[k].moderation %></div>
                  <% } %>
                <% } %>
                <% if(posts[k].descEdit.length != 0){ %>
                  <div class="badge badge-warning text-xxs">Edited</div>
                <% } %>
              </div>
            </div>
          </div>
          <% if(currentUser){ %>
            <div class="dropdown">
              <button class="btn btn-sm dropdown-toggle" type="button" data-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
              <ul class="dropdown-menu dropdown-menu-right dropbox">
                <div class="container drop-shadow1">
                  <li><a class="dropitems text-sm" href="#">Help ?</a></li>
                  <% if(currentUser._id == posts[k].postAuthor.id){ %>
                    <hr>
                    <li>
                      <button class="dropitems link-button text-sm red" href="#delPostModalclubs<%= posts[k].postClub._id %>posts<%= posts[k]._id %>" data-toggle="modal">Delete post</button>
                    </li>
                  <% } %>
                </div>
              </ul>
              <% if(currentUser._id == posts[k].postAuthor.id){ %>
                <div id="delPostModalclubs<%= posts[k].postClub._id %>posts<%= posts[k]._id %>" class="fixed-padding modal fade">
                  <div class="modal-dialog modal-confirm">
                    <div class="modal-content">
                      <div class="d-flex">
                        <span class="icon-box">
                          <i class="fas fa-exclamation-triangle text-xxxl"></i>
                        </span>              
                        <span class="my-auto"><h5 class="modal-title">Are you sure?</h5></span>
                        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                      </div>
                      <div>
                        <p>Do you really want to delete this post? This cannot be undone.</p>
                      </div>
                      <div class="my-2">
                        <button type="button" class="btn btn-secondary btn-sm mr-1" data-dismiss="modal">Cancel</button>
                        <form class="delete-form inline" action="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>?_method=DELETE" method="POST">
                          <button class="btn btn-danger btn-sm ml-1" type="submit">Delete</button>
                          <input type="hidden" name="_csrf" value="<%= csrfToken %>">
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              <% } %>
            </div>
          <% } %>
        </div>
      </div>
      <% if(posts[k].image){ %>
        <a href="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>">
          <div class="postimgpad"><div class="postimgcorner"><img class="card-img-top postimg" src="<%= posts[k].image %>"></div></div>
        </a>
        <div class="card-body">
          <p class="truncate nothing mobiletext linewrap"><%= posts[k].description %></p>
          <em class="nothing mobiletext linewrap"><a href="<%= decodeURI(posts[k].hyperlink) %>" target="_blank" rel="noopener" class="truncate1"><%= decodeURI(posts[k].hyperlink) %></a></em>
          <div class="lightgrey2">
            <span>
              <em class="text-xxs"><%= moment(posts[k].createdAt).calendar() %></em>
            </span>
            <% if(posts[k].commentsCount > 0){ %>
               . <span class="boldtext nothing text-xxs">
                <%= posts[k].commentsCount %><% if(posts[k].commentsCount == 1){ %> <i class="fas fa-comment"></i> <% } else{ %> <i class="fas fa-comments"></i> <% } %>
              </span>
            <% } %>
          </div>
        </div>
        <hr class="hr-light mx-2">
      <% } else{ %>
        <div class="card-body2 nounderline nothing">
          <a href="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>">
            <% if(posts[k].description.length < 200){ %>
              <p class="truncate2 nothing mobiletext linewrap nolink description-short"><%= posts[k].description %></p>
            <% } else{ %>
              <p class="truncate2 nothing mobiletext linewrap nolink"><%= posts[k].description %></p>
            <% } %>
            <em class="nothing mobiletext linewrap"><a href="<%= decodeURI(posts[k].hyperlink) %>" target="_blank" rel="noopener" class="truncate1"><%= decodeURI(posts[k].hyperlink) %></a></em>
            <div class="lightgrey2">
              <span>
                <em class="text-xxs"><%= moment(posts[k].createdAt).calendar() %></em>
              </span>
              <% if(posts[k].commentsCount > 0){ %>
                 . <span class="boldtext nothing text-xxs">
                  <%= posts[k].commentsCount %><% if(posts[k].commentsCount == 1){ %> <i class="fas fa-comment"></i> <% } else{ %> <i class="fas fa-comments"></i> <% } %>
                </span>
              <% } %>
            </div>
          </a>
        </div>
        <hr class="hr-light mx-2">
      <% } %>
      <div class="card-body3">
        <form class="valign" action="/posts/<%= posts[k]._id %>/vote" method="POST">
          <div class="valign">
            <% if(currentUser){ %>
              <% if(hasVote[k] == 1){ %>
                <span class="d-flex mr-1"> 
                  <button id="like-btn<%= posts[k]._id %>" class="vote likebtn" name="like" type="submit" value="like" title="Like"><i class="fas fa-thumbs-up greencolor"></i></button>
                </span>
                <span id="like-count<%= posts[k]._id %>" class="boldtext darkgrey nothing text-sm greencolor3"><%= posts[k].likeCount %></span>
              <% } else if(hasVote[k] == 0 || hasVote[k] == 3){ %>
                <span class="d-flex mr-1"> 
                  <button id="like-btn<%= posts[k]._id %>" class="vote likebtn" name="like" type="submit" value="like" title="Like"><i class="far fa-thumbs-up"></i></button>
                </span>
                <span id="like-count<%= posts[k]._id %>" class="nodisplay boldtext darkgrey nothing text-sm"><%= posts[k].likeCount %></span>
              <% } %>
            <% } else{ %>
              <span class="d-flex mr-1"> 
                <button id="like-btn<%= posts[k]._id %>" class="vote" name="like" type="submit" value="like" title="Like"><i class="fas fa-thumbs-up"></i></button>
              </span>
              <span id="like-count<%= posts[k]._id %>" class="nodisplay boldtext darkgrey nothing text-sm"><%= posts[k].likeCount %></span>
            <% } %>
          </div>
        
          <div class="valign">
            <% if(currentUser){ %>
              <% if(hasVote[k] == 3){ %>
                <span id="heart-count<%= posts[k]._id %>" class="boldtext darkgrey nothing text-sm redcolor3"><%= posts[k].heartCount %></span>
                <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart redcolor2"></i></button></span>
              <% } else if(hasVote[k] == 0 || hasVote[k] == 1){ %>
                <span id="heart-count<%= posts[k]._id %>" class="nodisplay boldtext darkgrey nothing text-sm"><%= posts[k].heartCount %></span>
                <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart"></i></button></span>
                <% } %>
            <% } else{ %>
              <span id="heart-count<%= posts[k]._id %>" class="nodisplay boldtext darkgrey nothing text-sm"><%= posts[k].heartCount %></span>
              <span><button id="heart-btn<%= posts[k]._id %>" class="vote" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart"></i></button></span>
            <% } %>
          </div>
          <input type="hidden" name="_csrf" value="<%= csrfToken %>">
        </form>
      </div>
    </div>
    <!-- COMMENTS -->
    <div class="mt-1"></div>
    <div class="card m-0 post-tail">
      <% if(posts[k].commentsCount != 0){ %>
        <div class="card-body3">
          <% var z=1; var buckets = posts[k].commentBuckets; var len1 = buckets.length; var i; for(i=len1-1;i>=0;i--){%>
            <% var comments = buckets[i].comments; var len2 = comments.length; var j; for(j=len2-1;j>=0;j--){%>
            <% if(z<=2){ %>
              <div class="valign">
                <div class="wordwrap lineheight my-15">
                  <span><a href="/users/<%= comments[j].commentAuthor.id %>" class="black"><span class="nothing mobiletext boldtext"><%= comments[j].commentAuthor.authorName %></span></a>
                  </span>
                  <span class="mobiletext"><%= comments[j].text %></span>
                </div>
              </div>
            <% z++;} %>
            <% } %>
          <% } %>
        </div>
      <% } %>
      <div class="card-body3">
        <div class="commentdiv">
          <form action="/posts/<%= posts[k]._id %>/comments" method="POST">
            <div class="input-group">
              <input onclick="block_display('commentbtn<%= posts[k]._id %>');" id="commentbox<%= posts[k]._id %>" class="commentbox text-sm form-control form-control-sm" type="text" name="text" placeholder="Write a comment" required>
            </div>
            <div class="d-flex flex-row-reverse">
              <button class="btn btn-sm btn-success commentbtn commentbtn<%= posts[k]._id %> btnxs ml-2 mt-2">Submit</button>
              <button onclick="none_display('commentbtn<%= posts[k]._id %>'); clear_text();" class="btn btn-secondary commentbtn commentbtn<%= posts[k]._id %> btnxs text-sm mt-2" type="button">Cancel</button>
            </div>
            <input type="hidden" name="_csrf" value="<%= csrfToken %>">
          </form>
        </div>
      </div>
    </div>
  <% } else{ %>
    <!-- TOPIC POSTS -->
    <div class="noborder d-flex flex-row justify-content-between">
      <% if(k == 0){ %>
        <div class="card mt-0 pt-3 topic-break flex-column justify-content-between">
      <% } else{ %>
        <div class="card mt-3 topic-break flex-column justify-content-between">
      <% } %>
        <div>
          <div class="card-body">
            <div class="dropctn">
              <div class="valign lineheight">
                <div>
                  <a href="/clubs/<%= posts[k].postClub._id %>"><img class="navdp rounded-circle mr-2" src="<%= PC_50_clubAvatar[k] || '/images/noClub.png' %>"></a>
                </div>
                <div class="lineheight2">
                  <div>
                    <span class="mobiletext2">
                      <a href="/clubs/<%= posts[k].postClub._id %>" class="darkgrey"><strong><%= posts[k].postClub.name %></strong></a>
                    </span>
                    <em class="text-xxs lightgrey2">. <%= moment(posts[k].createdAt).calendar() %></em>
                  </div>
                  <div>
                    <% if(currentUser && match){ %>
                      <div class="badge badge-light text-xxs"><%= privacyText(posts[k].privacy) %></div>
                      <% if(0 <= posts[k].moderation && posts[k].moderation <= 1){ %>
                        <div id="mod-badge<%= posts[k]._id %>" class="mod-badge badge badge-light text-xxs"><%= posts[k].moderation %></div>
                      <% } else if(posts[k].moderation == -1){ %>
                        <div id="mod-badge<%= posts[k]._id %>" class="mod-badge badge badge-danger text-xxs"><%= posts[k].moderation %></div>
                      <% } %>
                    <% } %>
                    <% if(posts[k].descEdit.length != 0){ %>
                      <div class="badge badge-warning text-xxs">Edited</div>
                    <% } %>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <a href="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>" style="text-decoration: none;">
            <div class="valign topic-head">
              <div class="px-2 mb-auto">
                <h5 class="nothing topic-h5"><%= posts[k].topic %></h5>
              </div>
            </div>
          </a>
        </div>
        <div>
          <div class="nounderline nothing">
            <% if(posts[k].image){ %>
              <div class="truncate nothing mobiletext linewrap card-body3"><%= posts[k].description %></div>
              <% if(posts[k].hyperlink && posts[k].hyperlink != ''){ %>
                <div class="card-body3"><em class="nothing mobiletext linewrap"><a href="<%= decodeURI(posts[k].hyperlink) %>" target="_blank" rel="noopener" class="truncate1"><%= decodeURI(posts[k].hyperlink) %></a></em></div>
              <% } %>
              <a href="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>">
                <div class="topicimgpad"><div class="postimgcorner"><img class="card-img-top postimg topicimg" src="<%= posts[k].image %>"></div></div>
              </a>
            <% } else{ %>
              <a href="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>">
                <div class="truncate2 card-body3 mobiletext linewrap nolink"><%= posts[k].description %></div>
                <% if(posts[k].hyperlink && posts[k].hyperlink != ''){ %>
                  <div class="card-body3"><em class="nothing mobiletext linewrap"><a href="<%= decodeURI(posts[k].hyperlink) %>" target="_blank" rel="noopener" class="truncate1"><%= decodeURI(posts[k].hyperlink) %></a></em></div>
                <% } %>
              </a>
            <% } %>
          </div>
          <% if(posts[k].subpostsCount > 0){ %>
            <div class="card-body5">
              <% if(!posts[k].image){ %>
                <hr class="hr-light">
              <% } %>
              <div>
                <span class="lightgrey2 text-xs"><strong><%= posts[k].subpostsCount %></strong> <i class="fas fa-comment-alt"></i></span>
              </div>
            </div>
          <% } %>
        </div>
      </div>
      <!-- TOPIC COLUMN -->
      <% if(k == 0){ %>
        <div class="d-flex flex-column topic-column mt-0 pt-3">
      <% } else{ %>
        <div class="d-flex flex-column topic-column mt-3">
      <% } %>
        <div class="d-flex flex-column mb-auto">
          <div class="mx-auto my-2 py-1">
            <% if(currentUser){ %>
              <div class="dropdown">
                <button class="btn btn-sm dropdown-toggle" type="button" data-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
                <ul class="dropdown-menu dropdown-menu-right dropbox">
                  <div class="container drop-shadow1">
                    <li><a class="dropitems text-sm" href="#">Help ?</a></li>
                    <% if(currentUser._id == posts[k].postAuthor.id){ %>
                      <hr>
                      <li>
                        <button class="dropitems link-button text-sm red" href="#delPostModalclubs<%= posts[k].postClub._id %>posts<%= posts[k]._id %>" data-toggle="modal">Delete post</button>
                      </li>
                    <% } %>
                  </div>
                </ul>
                <% if(currentUser._id == posts[k].postAuthor.id){ %>
                  <div id="delPostModalclubs<%= posts[k].postClub._id %>posts<%= posts[k]._id %>" class="fixed-padding modal fade">
                    <div class="modal-dialog modal-confirm">
                      <div class="modal-content">
                        <div class="d-flex">
                          <span class="icon-box">
                            <i class="fas fa-exclamation-triangle text-xxxl"></i>
                          </span>              
                          <span class="my-auto"><h5 class="modal-title">Are you sure?</h5></span>
                          <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                        </div>
                        <div>
                          <p>Do you really want to delete this post? This cannot be undone.</p>
                        </div>
                        <div class="my-2">
                          <button type="button" class="btn btn-secondary btn-sm mr-1" data-dismiss="modal">Cancel</button>
                          <form class="delete-form inline" action="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>?_method=DELETE" method="POST">
                            <button class="btn btn-danger btn-sm ml-1" type="submit">Delete</button>
                            <input type="hidden" name="_csrf" value="<%= csrfToken %>">
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                <% } %>
              </div>
            <% } %>
          </div>
          <div style="margin-top: -1rem; margin-bottom: -0.5rem;">
            <div class="mx-2 mb-auto d-flex flex-column">
              <form class="d-flex flex-column post-modvote-form" action="/posts/<%= posts[k]._id %>/modvote" method="POST">
                <% if(hasModVote[k] == 1){%>
                  <button id="upVote-btn<%= posts[k]._id %>" class="modvote upVotebtn bluecolor on" name="upVote" type="submit" value="up" title="Upvote"><i class="fas fa-caret-up"></i></button>
                  <span id="modVote-count<%= posts[k]._id %>" class="modvote-count boldtext nothing text-xs text-center bluecolor3"><%= posts[k].upVoteCount - posts[k].downVoteCount %></span>
                  <button id="downVote-btn<%= posts[k]._id %>" class="modvote downVotebtn" name="downVote" type="submit" value="down" title="Downvote"><i class="fas fa-caret-down"></i></button>
                <% } else if(hasModVote[k] == -1){ %>
                  <button id="upVote-btn<%= posts[k]._id %>" class="modvote upVotebtn" name="upVote" type="submit" value="up" title="Upvote"><i class="fas fa-caret-up"></i></button>
                  <span id="modVote-count<%= posts[k]._id %>" class="modvote-count boldtext nothing text-xs text-center orangecolor"><%= posts[k].upVoteCount - posts[k].downVoteCount %></span>
                  <button id="downVote-btn<%= posts[k]._id %>" class="modvote downVotebtn orangecolor on" name="downVote" type="submit" value="down" title="Downvote"><i class="fas fa-caret-down"></i></button>
                <% } else if(hasModVote[k] == 0){ %>
                  <button id="upVote-btn<%= posts[k]._id %>" class="modvote upVotebtn" name="upVote" type="submit" value="up" title="Upvote"><i class="fas fa-caret-up"></i></button>
                  <span id="modVote-count<%= posts[k]._id %>" class="modvote-count boldtext darkgrey nothing text-xs text-center"><%= posts[k].upVoteCount - posts[k].downVoteCount %></span>
                  <button id="downVote-btn<%= posts[k]._id %>" class="modvote downVotebtn" name="downVote" type="submit" value="down" title="Downvote"><i class="fas fa-caret-down"></i></button>
                <% } %>
                <input type="hidden" name="_csrf" value="<%= csrfToken %>">
              </form>
            </div>
          </div>
        </div>
        <div>
          <form action="/posts/<%= posts[k]._id %>/vote" method="POST">
            <div class="d-flex flex-column">
              <% if(currentUser){ %>
                <% if(hasVote[k] == 3){ %>
                  <div id="heart-count<%= posts[k]._id %>" class="boldtext darkgrey nothing text-sm redcolor3 mx-auto topic-heart mt-2"><%= posts[k].heartCount %></div>
                  <div class="mx-auto pb-1"><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart redcolor2"></i></button></div>
                <% } else if(hasVote[k] == 0){ %>
                  <div id="heart-count<%= posts[k]._id %>" class="nodisplay boldtext darkgrey nothing text-sm mx-auto topic-heart mt-2"><%= posts[k].heartCount %></div>
                  <div class="mx-auto pb-1"><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart"></i></button></div>
                  <% } %>
                    <div class="nodisplay" id="modVisibility<%= posts[k]._id %>"></div>
              <% } else{ %>
                <div class="mx-auto pb-1"><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart"></i></button></div>
              <% } %>
            </div>
            <input type="hidden" name="_csrf" value="<%= csrfToken %>">
          </form>
        </div>
      </div>
    </div>
  <% } %>
<% } %>
`,{hasVote: response.hasVote, hasModVote: response.hasModVote, posts: response.posts, 
  match: response.match, currentUser: response.currentUser, PC_50_clubAvatar: response.PC_50_clubAvatar, 
  CU_50_profilePic: response.CU_50_profilePic, csrfToken: response.csrfToken});
  return html;
}

function heart_posts_template(response){ 
  html = ejs.render(`
<% var len = postsH.length; var l=0; for(l;l<len;l++){ %>
  <!-- SIMPLE POSTS -->
  <% if(postsH[l].topic == ''){ %>
    <% if(l == 0){ %>
      <div class="card mt-0 pt-3 post-head">
    <% } else{ %>
      <div class="card post-head">
    <% } %>
      <div class="card-body">
        <div class="dropctn">
          <div class="valign lineheight">
            <div>
              <a href="/clubs/<%= postsH[l].postClub._id %>"><img class="navdp rounded-circle mr-2" src="<%= PC_50_clubAvatarH[l] || '/images/noClub.png' %>"></a>
            </div>
            <div class="lineheight2">
              <div>
                <span class="mobiletext2">
                  <a href="/clubs/<%= postsH[l].postClub._id %>" class="darkgrey"><strong><%= postsH[l].postClub.name %></strong></a>
                </span>
              </div>
              <div>
                <% if(currentUser && match){ %>
                  <div class="badge badge-light text-xxs"><%= privacyText(postsH[l].privacy) %></div>
                  <% if(0 <= postsH[l].moderation && postsH[l].moderation <= 1){ %>
                    <div id="mod-badge<%= postsH[l]._id %>" class="mod-badge badge badge-light text-xxs"><%= postsH[l].moderation %></div>
                  <% } else if(postsH[l].moderation == -1){ %>
                    <div id="mod-badge<%= postsH[l]._id %>" class="mod-badge badge badge-danger text-xxs"><%= postsH[l].moderation %></div>
                  <% } %>
                <% } %>
                <% if(postsH[l].descEdit.length != 0){ %>
                  <div class="badge badge-warning text-xxs">Edited</div>
                <% } %>
              </div>
            </div>
          </div>
          <% if(currentUser){ %>
            <div class="dropdown">
              <button class="btn btn-sm dropdown-toggle" type="button" data-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
              <ul class="dropdown-menu dropdown-menu-right dropbox">
                <div class="container drop-shadow1">
                  <li><a class="dropitems text-sm" href="#">Help ?</a></li>
                  <% if(currentUser._id == postsH[l].postAuthor.id){ %>
                    <hr>
                    <li>
                      <button class="dropitems link-button text-sm red" href="#delPostModalclubs<%= postsH[l].postClub._id %>postsH<%= postsH[l]._id %>" data-toggle="modal">Delete post</button>
                    </li>
                  <% } %>
                </div>
              </ul>
              <% if(currentUser._id == postsH[l].postAuthor.id){ %>
                <div id="delPostModalclubs<%= postsH[l].postClub._id %>postsH<%= postsH[l]._id %>" class="fixed-padding modal fade">
                  <div class="modal-dialog modal-confirm">
                    <div class="modal-content">
                      <div class="d-flex">
                        <span class="icon-box">
                          <i class="fas fa-exclamation-triangle text-xxxl"></i>
                        </span>              
                        <span class="my-auto"><h5 class="modal-title">Are you sure?</h5></span>
                        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                      </div>
                      <div>
                        <p>Do you really want to delete this post? This cannot be undone.</p>
                      </div>
                      <div class="my-2">
                        <button type="button" class="btn btn-secondary btn-sm mr-1" data-dismiss="modal">Cancel</button>
                        <form class="delete-form inline" action="/clubs/<%= postsH[l].postClub._id %>/posts/<%= postsH[l]._id %>?_method=DELETE" method="POST">
                          <button class="btn btn-danger btn-sm ml-1" type="submit">Delete</button>
                          <input type="hidden" name="_csrf" value="<%= csrfToken %>">
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              <% } %>
            </div>
          <% } %>
        </div>
      </div>
      <% if(postsH[l].image){ %>
        <a href="/clubs/<%= postsH[l].postClub._id %>/posts/<%= postsH[l]._id %>">
          <div class="postimgpad"><div class="postimgcorner"><img class="card-img-top postimg" src="<%= postsH[l].image %>"></div></div>
        </a>
        <div class="card-body">
          <p class="truncate nothing mobiletext linewrap"><%= postsH[l].description %></p>
          <em class="nothing mobiletext linewrap"><a href="<%= decodeURI(postsH[l].hyperlink) %>" target="_blank" rel="noopener" class="truncate1"><%= decodeURI(postsH[l].hyperlink) %></a></em>
          <div class="lightgrey2">
            <span>
              <em class="text-xxs"><%= moment(postsH[l].createdAt).calendar() %></em>
            </span>
            <% if(postsH[l].commentsCount > 0){ %>
               . <span class="boldtext nothing text-xxs">
                <%= postsH[l].commentsCount %><% if(postsH[l].commentsCount == 1){ %> <i class="fas fa-comment"></i> <% } else{ %> <i class="fas fa-comments"></i> <% } %>
              </span>
            <% } %>
          </div>
        </div>
        <hr class="hr-light mx-2">
      <% } else{ %>
        <div class="card-body2 nounderline nothing">
          <a href="/clubs/<%= postsH[l].postClub._id %>/posts/<%= postsH[l]._id %>">
            <% if(postsH[l].description.length < 200){ %>
              <p class="truncate2 nothing mobiletext linewrap nolink description-short"><%= postsH[l].description %></p>
            <% } else{ %>
              <p class="truncate2 nothing mobiletext linewrap nolink"><%= postsH[l].description %></p>
            <% } %>
            <em class="nothing mobiletext linewrap"><a href="<%= decodeURI(postsH[l].hyperlink) %>" target="_blank" rel="noopener" class="truncate1"><%= decodeURI(postsH[l].hyperlink) %></a></em>
            <div class="lightgrey2">
              <span>
                <em class="text-xxs"><%= moment(postsH[l].createdAt).calendar() %></em>
              </span>
              <% if(postsH[l].commentsCount > 0){ %>
                 . <span class="boldtext nothing text-xxs">
                  <%= postsH[l].commentsCount %><% if(postsH[l].commentsCount == 1){ %> <i class="fas fa-comment"></i> <% } else{ %> <i class="fas fa-comments"></i> <% } %>
                </span>
              <% } %>
            </div>
          </a>
        </div>
        <hr class="hr-light mx-2">
      <% } %>
      <div class="card-body3">
        <form class="valign" action="/posts/<%= postsH[l]._id %>/vote" method="POST">
          <div class="valign">
            <% if(currentUser){ %>
              <% if(hasVoteH[l] == 1){ %>
                <span class="d-flex mr-1"> 
                  <button id="like-btnH<%= postsH[l]._id %>" class="vote likebtn" name="like" type="submit" value="like" title="Like"><i class="fas fa-thumbs-up greencolor"></i></button>
                </span>
                <span id="like-countH<%= postsH[l]._id %>" class="boldtext darkgrey nothing text-sm greencolor3"><%= postsH[l].likeCount %></span>
              <% } else if(hasVoteH[l] == 0 || hasVoteH[l] == 3){ %>
                <span class="d-flex mr-1"> 
                  <button id="like-btnH<%= postsH[l]._id %>" class="vote likebtn" name="like" type="submit" value="like" title="Like"><i class="far fa-thumbs-up"></i></button>
                </span>
                <span id="like-countH<%= postsH[l]._id %>" class="nodisplay boldtext darkgrey nothing text-sm"><%= postsH[l].likeCount %></span>
              <% } %>
            <% } else{ %>
              <span class="d-flex mr-1"> 
                <button id="like-btnH<%= postsH[l]._id %>" class="vote" name="like" type="submit" value="like" title="Like"><i class="fas fa-thumbs-up"></i></button>
              </span>
              <span id="like-countH<%= postsH[l]._id %>" class="nodisplay boldtext darkgrey nothing text-sm"><%= postsH[l].likeCount %></span>
            <% } %>
          </div>
        
          <div class="valign">
            <% if(currentUser){ %>
              <% if(hasVoteH[l] == 3){ %>
                <span id="heart-countH<%= postsH[l]._id %>" class="boldtext darkgrey nothing text-sm redcolor3"><%= postsH[l].heartCount %></span>
                <span><button id="heart-btnH<%= postsH[l]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart redcolor2"></i></button></span>
              <% } else if(hasVoteH[l] == 0 || hasVoteH[l] == 1){ %>
                <span id="heart-countH<%= postsH[l]._id %>" class="nodisplay boldtext darkgrey nothing text-sm"><%= postsH[l].heartCount %></span>
                <span><button id="heart-btnH<%= postsH[l]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart"></i></button></span>
                <% } %>
            <% } else{ %>
              <span id="heart-countH<%= postsH[l]._id %>" class="nodisplay boldtext darkgrey nothing text-sm"><%= postsH[l].heartCount %></span>
              <span><button id="heart-btnH<%= postsH[l]._id %>" class="vote" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart"></i></button></span>
            <% } %>
          </div>
          <input type="hidden" name="_csrf" value="<%= csrfToken %>">
        </form>
      </div>
    </div>
    <!-- COMMENTS -->
    <div class="mt-1"></div>
    <div class="card m-0 post-tail">
      <% if(postsH[l].commentsCount != 0){ %>
        <div class="card-body3">
          <% var z=1; var buckets = postsH[l].commentBuckets; var len1 = buckets.length; var i; for(i=len1-1;i>=0;i--){%>
            <% var comments = buckets[i].comments; var len2 = comments.length; var j; for(j=len2-1;j>=0;j--){%>
            <% if(z<=2){ %>
              <div class="valign">
                <div class="wordwrap lineheight my-15">
                  <span><a href="/users/<%= comments[j].commentAuthor.id %>" class="black"><span class="nothing mobiletext boldtext"><%= comments[j].commentAuthor.authorName %></span></a>
                  </span>
                  <span class="mobiletext"><%= comments[j].text %></span>
                </div>
              </div>
            <% z++;} %>
            <% } %>
          <% } %>
        </div>
      <% } %>
      <div class="card-body3">
        <div class="commentdiv">
          <form action="/posts/<%= postsH[l]._id %>/comments" method="POST">
            <div class="input-group">
              <input onclick="block_display('commentbtn<%= postsH[l]._id %>');" id="commentbox<%= postsH[l]._id %>" class="commentbox text-sm form-control form-control-sm" type="text" name="text" placeholder="Write a comment" required>
            </div>
            <div class="d-flex flex-row-reverse">
              <button class="btn btn-sm btn-success commentbtn commentbtn<%= postsH[l]._id %> btnxs ml-2 mt-2">Submit</button>
              <button onclick="none_display('commentbtn<%= postsH[l]._id %>'); clear_text();" class="btn btn-secondary commentbtn commentbtn<%= postsH[l]._id %> btnxs text-sm mt-2" type="button">Cancel</button>
            </div>
            <input type="hidden" name="_csrf" value="<%= csrfToken %>">
          </form>
        </div>
      </div>
    </div>
  <% } else{ %>
    <!-- TOPIC POSTS -->
    <div class="noborder d-flex flex-row justify-content-between">
      <% if(l == 0){ %>
        <div class="card mt-0 pt-3 topic-break flex-column justify-content-between">
      <% } else{ %>
        <div class="card mt-3 topic-break flex-column justify-content-between">
      <% } %>
        <div>
          <div class="card-body">
            <div class="dropctn">
              <div class="valign lineheight">
                <div>
                  <a href="/clubs/<%= postsH[l].postClub._id %>"><img class="navdp rounded-circle mr-2" src="<%= PC_50_clubAvatarH[l] || '/images/noClub.png' %>"></a>
                </div>
                <div class="lineheight2">
                  <div>
                    <span class="mobiletext2">
                      <a href="/clubs/<%= postsH[l].postClub._id %>" class="darkgrey"><strong><%= postsH[l].postClub.name %></strong></a>
                    </span>
                    <em class="text-xxs lightgrey2">. <%= moment(postsH[l].createdAt).calendar() %></em>
                  </div>
                  <div>
                    <% if(currentUser && match){ %>
                      <div class="badge badge-light text-xxs"><%= privacyText(postsH[l].privacy) %></div>
                      <% if(0 <= postsH[l].moderation && postsH[l].moderation <= 1){ %>
                        <div id="mod-badge<%= postsH[l]._id %>" class="mod-badge badge badge-light text-xxs"><%= postsH[l].moderation %></div>
                      <% } else if(postsH[l].moderation == -1){ %>
                        <div id="mod-badge<%= postsH[l]._id %>" class="mod-badge badge badge-danger text-xxs"><%= postsH[l].moderation %></div>
                      <% } %>
                    <% } %>
                    <% if(postsH[l].descEdit.length != 0){ %>
                      <div class="badge badge-warning text-xxs">Edited</div>
                    <% } %>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <a href="/clubs/<%= postsH[l].postClub._id %>/posts/<%= postsH[l]._id %>" style="text-decoration: none;">
            <div class="valign topic-head">
              <div class="px-2 mb-auto">
                <h5 class="nothing topic-h5"><%= postsH[l].topic %></h5>
              </div>
            </div>
          </a>
        </div>
        <div>
          <div class="nounderline nothing">
            <% if(postsH[l].image){ %>
              <div class="truncate nothing mobiletext linewrap card-body3"><%= postsH[l].description %></div>
              <% if(postsH[l].hyperlink && postsH[l].hyperlink != ''){ %>
                <div class="card-body3"><em class="nothing mobiletext linewrap"><a href="<%= decodeURI(postsH[l].hyperlink) %>" target="_blank" rel="noopener" class="truncate1"><%= decodeURI(postsH[l].hyperlink) %></a></em></div>
              <% } %>
              <a href="/clubs/<%= postsH[l].postClub._id %>/posts/<%= postsH[l]._id %>">
                <div class="topicimgpad"><div class="postimgcorner"><img class="card-img-top postimg topicimg" src="<%= postsH[l].image %>"></div></div>
              </a>
            <% } else{ %>
              <a href="/clubs/<%= postsH[l].postClub._id %>/posts/<%= postsH[l]._id %>">
                <div class="truncate2 card-body3 mobiletext linewrap nolink"><%= postsH[l].description %></div>
                <% if(postsH[l].hyperlink && postsH[l].hyperlink != ''){ %>
                  <div class="card-body3"><em class="nothing mobiletext linewrap"><a href="<%= decodeURI(postsH[l].hyperlink) %>" target="_blank" rel="noopener" class="truncate1"><%= decodeURI(postsH[l].hyperlink) %></a></em></div>
                <% } %>
              </a>
            <% } %>
          </div>
          <% if(postsH[l].subpostsCount > 0){ %>
            <div class="card-body5">
              <% if(!postsH[l].image){ %>
                <hr class="hr-light">
              <% } %>
              <div>
                <span class="lightgrey2 text-xs"><strong><%= postsH[l].subpostsCount %></strong> <i class="fas fa-comment-alt"></i></span>
              </div>
            </div>
          <% } %>
        </div>
      </div>
      <!-- TOPIC COLUMN -->
      <% if(l == 0){ %>
        <div class="d-flex flex-column topic-column mt-0 pt-3">
      <% } else{ %>
        <div class="d-flex flex-column topic-column mt-3">
      <% } %>
        <div class="d-flex flex-column mb-auto">
          <div class="mx-auto my-2 py-1">
            <% if(currentUser){ %>
              <div class="dropdown">
                <button class="btn btn-sm dropdown-toggle" type="button" data-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
                <ul class="dropdown-menu dropdown-menu-right dropbox">
                  <div class="container drop-shadow1">
                    <li><a class="dropitems text-sm" href="#">Help ?</a></li>
                    <% if(currentUser._id == postsH[l].postAuthor.id){ %>
                      <hr>
                      <li>
                        <button class="dropitems link-button text-sm red" href="#delPostModalclubs<%= postsH[l].postClub._id %>postsH<%= postsH[l]._id %>" data-toggle="modal">Delete post</button>
                      </li>
                    <% } %>
                  </div>
                </ul>
                <% if(currentUser._id == postsH[l].postAuthor.id){ %>
                  <div id="delPostModalclubs<%= postsH[l].postClub._id %>postsH<%= postsH[l]._id %>" class="fixed-padding modal fade">
                    <div class="modal-dialog modal-confirm">
                      <div class="modal-content">
                        <div class="d-flex">
                          <span class="icon-box">
                            <i class="fas fa-exclamation-triangle text-xxxl"></i>
                          </span>              
                          <span class="my-auto"><h5 class="modal-title">Are you sure?</h5></span>
                          <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                        </div>
                        <div>
                          <p>Do you really want to delete this post? This cannot be undone.</p>
                        </div>
                        <div class="my-2">
                          <button type="button" class="btn btn-secondary btn-sm mr-1" data-dismiss="modal">Cancel</button>
                          <form class="delete-form inline" action="/clubs/<%= postsH[l].postClub._id %>/posts/<%= postsH[l]._id %>?_method=DELETE" method="POST">
                            <button class="btn btn-danger btn-sm ml-1" type="submit">Delete</button>
                            <input type="hidden" name="_csrf" value="<%= csrfToken %>">
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                <% } %>
              </div>
            <% } %>
          </div>
          <div style="margin-top: -1rem; margin-bottom: -0.5rem;">
            <div class="mx-2 mb-auto d-flex flex-column">
              <form class="d-flex flex-column post-modvote-form" action="/posts/<%= postsH[l]._id %>/modvote" method="POST">
                <% if(hasModVoteH[l] == 1){%>
                  <button id="upVote-btn<%= postsH[l]._id %>" class="modvote upVotebtn bluecolor on" name="upVote" type="submit" value="up" title="Upvote"><i class="fas fa-caret-up"></i></button>
                  <span id="modVote-count<%= postsH[l]._id %>" class="modvote-count boldtext nothing text-xs text-center bluecolor3"><%= postsH[l].upVoteCount - postsH[l].downVoteCount %></span>
                  <button id="downVote-btn<%= postsH[l]._id %>" class="modvote downVotebtn" name="downVote" type="submit" value="down" title="Downvote"><i class="fas fa-caret-down"></i></button>
                <% } else if(hasModVoteH[l] == -1){ %>
                  <button id="upVote-btn<%= postsH[l]._id %>" class="modvote upVotebtn" name="upVote" type="submit" value="up" title="Upvote"><i class="fas fa-caret-up"></i></button>
                  <span id="modVote-count<%= postsH[l]._id %>" class="modvote-count boldtext nothing text-xs text-center orangecolor"><%= postsH[l].upVoteCount - postsH[l].downVoteCount %></span>
                  <button id="downVote-btn<%= postsH[l]._id %>" class="modvote downVotebtn orangecolor on" name="downVote" type="submit" value="down" title="Downvote"><i class="fas fa-caret-down"></i></button>
                <% } else if(hasModVoteH[l] == 0){ %>
                  <button id="upVote-btn<%= postsH[l]._id %>" class="modvote upVotebtn" name="upVote" type="submit" value="up" title="Upvote"><i class="fas fa-caret-up"></i></button>
                  <span id="modVote-count<%= postsH[l]._id %>" class="modvote-count boldtext darkgrey nothing text-xs text-center"><%= postsH[l].upVoteCount - postsH[l].downVoteCount %></span>
                  <button id="downVote-btn<%= postsH[l]._id %>" class="modvote downVotebtn" name="downVote" type="submit" value="down" title="Downvote"><i class="fas fa-caret-down"></i></button>
                <% } %>
                <input type="hidden" name="_csrf" value="<%= csrfToken %>">
              </form>
            </div>
          </div>
        </div>
        <div>
          <form action="/posts/<%= postsH[l]._id %>/vote" method="POST">
            <div class="d-flex flex-column">
              <% if(currentUser){ %>
                <% if(hasVoteH[l] == 3){ %>
                  <div id="heart-countH<%= postsH[l]._id %>" class="boldtext darkgrey nothing text-sm redcolor3 mx-auto topic-heart mt-2"><%= postsH[l].heartCount %></div>
                  <div class="mx-auto pb-1"><button id="heart-btnH<%= postsH[l]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart redcolor2"></i></button></div>
                <% } else if(hasVoteH[l] == 0){ %>
                  <div id="heart-countH<%= postsH[l]._id %>" class="nodisplay boldtext darkgrey nothing text-sm mx-auto topic-heart mt-2"><%= postsH[l].heartCount %></div>
                  <div class="mx-auto pb-1"><button id="heart-btnH<%= postsH[l]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart"></i></button></div>
                  <% } %>
                    <div class="nodisplay" id="modVisibility<%= postsH[l]._id %>"></div>
              <% } else{ %>
                <div class="mx-auto pb-1"><button id="heart-btnH<%= postsH[l]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart"></i></button></div>
              <% } %>
            </div>
            <input type="hidden" name="_csrf" value="<%= csrfToken %>">
          </form>
        </div>
      </div>
    </div>
  <% } %>
<% } %>
`,{hasVoteH: response.hasVote, hasModVoteH: response.hasModVote, postsH: response.posts, 
  match: response.match, currentUser: response.currentUser, PC_50_clubAvatarH: response.PC_50_clubAvatarH, 
  CU_50_profilePicH: response.CU_50_profilePicH, csrfToken: response.csrfToken});
  return html;
}

function post_comments_template(response){
  html = ejs.render(`
<% var comments = buckets[0].comments; var len2 = comments.length; var j; for(j=len2-1;j>=0;j--){ %>
  <div class="mb-1">
    <div class="valign card-body1">
      <div class="mb-auto py-2 commentpad">
        <a href="/users/<%= comments[j].commentAuthor.id._id %>">
          <% if(comments[j].commentAuthor.id.userKeys.sex == 'Male'){ %>
            <img class="postdp rounded-circle" src="<%= CA_50_profilePic[j] || '/images/noUserMale.png' %>">
          <% } else if(comments[j].commentAuthor.id.userKeys.sex == 'Female'){ %>
            <img class="postdp rounded-circle" src="<%= CA_50_profilePic[j] || '/images/noUserFemale.png' %>">
          <% } %>
        </a>
      </div>
      <div class="commentdiv ml-2 my-1 pb-1 lineheight hr2">
        <div class="commentpad commentpad2">
          <div>
            <span><a href="/users/<%= comments[j].commentAuthor.id._id %>" class="text-sm darkgrey"><strong><span><%= comments[j].commentAuthor.id.fullName %></span></strong></a>
            </span>
            <span class="darkgrey text-xxs mobilebold"><%= moment(comments[j].postedAt).fromNow() %></span>
          </div>
        </div>
        <div class="valign">
          <div class="mobiletext linewrap wordwrap commentpad commentpad2 mb-1 mr-4"><%= comments[j].text %></div>
          <div class="d-flex flex-row">
            <% if(currentUser && comments[j].commentAuthor.id._id == currentUser){ %>
              <div class="dropdown">
                <button class="btn dropdown-toggle editprofile mx-1 px-2 py-0" type="button" data-toggle="dropdown"><i class="fas fa-ellipsis-v text-xxxs"></i></button>
                <ul class="dropdown-menu dropdown-menu-right dropbox">
                  <div class="container drop-shadow1">
                    <li>
                      <a class="dropitems text-sm" href="/posts/<%= post._id %>/comments/<%= buckets[0]._id %>/<%= comments[j]._id %>/edit">Edit comment</a>
                    </li>
                    <hr>
                    <li>
                      <button class="dropitems link-button red text-sm" href="#delBucket<%= i %>Comment<%= j %>Modal" data-toggle="modal">Delete comment</button>
                    </li>
                  </div>
                </ul>
              </div>
              <!-- Modal HTML -->
              <div id="delBucket<%= i %>Comment<%= j %>Modal" class="fixed-padding modal fade">
                <div class="modal-dialog modal-confirm">
                  <div class="modal-content">
                    <div class="d-flex">
                      <span class="icon-box">
                        <i class="fas fa-exclamation-triangle text-xxxl"></i>
                      </span>              
                      <span class="my-auto"><h5 class="modal-title">Are you sure?</h5></span>
                      <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                    </div>
                    <div>
                      <p>Do you really want to delete this comment? This cannot be undone.</p>
                    </div>
                    <div class="my-2">
                      <button type="button" class="btn btn-secondary btn-sm mr-1" data-dismiss="modal">Cancel</button>
                      <form class="delete-form inline text-sm" action="/posts/<%= post._id %>/comments/<%= buckets[0]._id %>/<%= comments[j]._id %>?_method=DELETE" method="POST">
                        <button class="btn btn-danger btn-sm ml-1" type="submit">Delete</button>
                        <input type="hidden" name="_csrf" value="<%= csrfToken %>">
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            <% } %>
            <form action="/comments/<%= buckets[0]._id %>/<%= comments[j]._id %>/vote" method="POST">
              <div class="commentwrap lineheight0 mb-2">
                <% if(upComments.includes(comments[j]._id)){ %>
                  <button id="comment-up-btn<%= comments[j]._id %>" class="vote redcolor2 commentvote valign" name="commentUp" type="button" value="up" title="Upvote comment">
                    <div>
                      <i class="fab fa-gratipay"></i>
                    </div>
                    <div id="comment-up-count<%= comments[j]._id %>" class="vote boldtext text-xs bluecolor3 ml-1 commentcount" name="commentUp" type="button" value="up" title="Upvote comment">
                      <%= comments[j].upvotesCount %>
                  </div>
                  </button>
                <% } else{ %>
                  <button id="comment-up-btn<%= comments[j]._id %>" class="vote commentvote valign" name="commentUp" type="button" value="up" title="Upvote comment">
                    <div>
                      <i class="fab fa-gratipay"></i>
                    </div>
                    <% if(comments[j].upvotesCount > 0){ %>
                      <div id="comment-up-count<%= comments[j]._id %>" class="vote boldtext text-xs lightgrey ml-1 commentcount" name="commentUp" type="button" value="up" title="Upvote comment">
                    <% } else{ %>
                      <div id="comment-up-count<%= comments[j]._id %>" class="vote boldtext text-xs lightgrey ml-1 commentcount invisible" name="commentUp" type="button" value="up" title="Upvote comment">
                    <% } %>
                      <%= comments[j].upvotesCount %>
                    </div>
                  </button>
                <% } %>
              </div>
              <input type="hidden" name="_csrf" value="<%= csrfToken %>">
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
<% } %>
`,{post: response.post, upComments: response.upComments, buckets: response.buckets, index: response.index,
  currentUser: response.currentUser, CA_50_profilePic: response.CA_50_profilePic, 
  csrfToken: response.csrfToken});
  return html;
}

function post_subPosts_template(response){
  html = ejs.render(` 
<% if(post.subpostBuckets.length >= 1){ %>
  <div class="dropctn mt-2 py-2">
    <div class="pr-2">
      <button class="btn btn-sm dropdown-toggle editprofile pr-0 py-0 invisible" type="button" data-toggle="dropdown"><i class="fas fa-chevron-down"></i></button>
    </div>
    <div class="my-2">
      <span><a href="/clubs/<%= clubId %>/posts/<%= post._id %>/m-sP" class="load-subPosts-btn btn btn-dark mb-1 btnxs text-xs boldtext" value="0"> << </a></span>
      <% if(index-1 > -1){ %>
        <span><a href="/clubs/<%= clubId %>/posts/<%= post._id %>/m-sP" class="load-subPosts-btn btn btn-dark mb-1 btnxs text-sm boldtext mx-1" value="<%= index-1 %>"> <%= index %> </a></span>
      <% } %>
      <span><a href="/clubs/<%= clubId %>/posts/<%= post._id %>/m-sP" id="subPost-index" class="load-subPosts-btn btn btn-primary mb-1 btnxs text-sm boldtext mx-1" value="<%= index %>"> <%= index+1 %> </a></span>
      <% if(index+1 < post.subpostBuckets.length){ %>
        <span><a href="/clubs/<%= clubId %>/posts/<%= post._id %>/m-sP" class="load-subPosts-btn btn btn-dark mb-1 btnxs text-sm boldtext mx-1" value="<%= index+1 %>"> <%= index+2 %> </a></span>
      <% } %>
      <span><a href="/clubs/<%= clubId %>/posts/<%= post._id %>/m-sP" class="load-subPosts-btn btn btn-dark mb-1 btnxs text-xs boldtext" value="<%= post.subpostBuckets.length-1 %>"> >> </a></span>
    </div>
    <div>
      <div class="dropdown ml-auto pr-2">
        <button class="btn btn-sm dropdown-toggle editprofile pr-0 py-0" type="button" data-toggle="dropdown"><i class="fas fa-chevron-down"></i></button>
        <div class="dropdown-menu dropdown-menu-right dropbox transparent">
          <div class="container drop-shadow1 floatright page-index-back">
            <div class="input-group input-group-sm px-2">
              <input href="/clubs/<%= clubId %>/posts/<%= post._id %>/m-sP" type="number" id="page-index-input" class="form-control search text-xs px-1" placeholder="Page ..">
              <div class="input-group-append">
                <button id="page-index-button" class="btn btn-secondary text-sm btnxs btnshadow" type="submit"> Go </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
<% } %>

<% var subPosts = bucket[0].subPosts; var len2 = subPosts.length; var j; for(j=0;j<len2;j++){ %>
  <div class="card indexcard2 my-2">
    <div class="card-body">
      <div>
        <div class="mb-auto d-flex flex-column subpost-left">
          <div>  
            <a href="/users/<%= subPosts[j].subPostAuthor.id._id %>">
              <% if(subPosts[j].subPostAuthor.id.userKeys.sex == 'Male'){ %>
                <img class="subpostdp mt-2 mb-1" src="<%= sPA_50_profilePic[j] || '/images/noUserMale.png' %>">
              <% } else if(subPosts[j].subPostAuthor.id.userKeys.sex == 'Female'){ %>
                <img class="subpostdp mt-2 mb-1" src="<%= sPA_50_profilePic[j] || '/images/noUserFemale.png' %>">
              <% } %>
            </a>
          </div>
          <div><span class="text-xs">#</span><span class="boldtext darkgrey nopad"><%= (j+1)+(20)*(bucket[0].bucket-1) %></span></div>
          <hr style="border-color: whitesmoke;">
          <div class="d-flex flex-row mx-auto whiteback" style="border-radius: 0 0 0.15rem 0.15rem;">
            <% if(0 <= rank && rank <= 4){ %>
              <form action="/subposts/<%= bucket[0]._id %>/<%= subPosts[j]._id %>/vote" method="POST">
                <% if(subVotes.subLikes.includes(subPosts[j]._id)){ %>
                  <span> 
                    <button id="like-btn<%= subPosts[j]._id %>" class="vote2 likebtn" name="subLike" type="submit" value="like" title="Agree"><i class="fas fa-thumbs-up vote-subpost2 greencolor"></i></button>
                  </span>
                  <span id="like-count<%= subPosts[j]._id %>" class="boldtext lightgrey nothing text-xxs greencolor3"><%= subPosts[j].likeCount %></span>
                  <span>
                    <button id="dislike-btn<%= subPosts[j]._id %>" class="vote2 dislikebtn" name="subDislike" type="submit" value="dislike" title="Disagree"><i class="vote-subpost far fa-thumbs-down vote-subpost2"></i></button>
                  </span>
                  <span id="dislike-count<%= subPosts[j]._id %>" class="boldtext lightgrey nothing text-xxs"><%= subPosts[j].dislikeCount %></span>
                <% } else if(subVotes.subDislikes.includes(subPosts[j]._id)){ %>
                  <span> 
                    <button id="like-btn<%= subPosts[j]._id %>" class="vote2 likebtn" name="subLike" type="submit" value="like" title="Agree"><i class="vote-subpost far fa-thumbs-up vote-subpost2"></i></button>
                  </span>
                  <span id="like-count<%= subPosts[j]._id %>" class="boldtext lightgrey nothing text-xxs"><%= subPosts[j].likeCount %></span>
                  <span>
                    <button id="dislike-btn<%= subPosts[j]._id %>" class="vote2 dislikebtn" name="subDislike" type="submit" value="dislike" title="Disagree"><i class="fas fa-thumbs-down vote-subpost2 blackcolor"></i></button>
                  </span>
                  <span id="dislike-count<%= subPosts[j]._id %>" class="boldtext lightgrey nothing text-xxs blackcolor"><%= subPosts[j].dislikeCount %></span>
                <% } else{ %>
                  <span> 
                    <button id="like-btn<%= subPosts[j]._id %>" class="vote2 likebtn" name="subLike" type="submit" value="like" title="Agree"><i class="vote-subpost far fa-thumbs-up vote-subpost2"></i></button>
                  </span>
                  <span id="like-count<%= subPosts[j]._id %>" class="boldtext lightgrey text-xxs nopad"><%= subPosts[j].likeCount %></span>
                  <span>
                    <button id="dislike-btn<%= subPosts[j]._id %>" class="vote2 dislikebtn" name="subDislike" type="submit" value="dislike" title="Disagree"><i class="vote-subpost far fa-thumbs-down vote-subpost2"></i></button>
                  </span>
                  <span id="dislike-count<%= subPosts[j]._id %>" class="boldtext lightgrey text-xxs nopad"><%= subPosts[j].dislikeCount %></span>
                <% } %>
                <input type="hidden" name="_csrf" value="<%= csrfToken %>">
              </form>
            <% } else{ %>
              <span class="mr-2"> 
                <button id="like-btn<%= subPosts[j]._id %>" class="vote2" name="like" type="submit" value="like" title="Agree"><i class="fas fa-thumbs-up vote-subpost2"></i></button>
              </span>
              <span class="ml-2">
                <button id="dislike-btn<%= subPosts[j]._id %>" class="vote2" name="dislike" type="submit" value="dislike" title="Disagree"><i class="fas fa-thumbs-down vote-subpost2"></i></button>
              </span>
            <% } %>
          </div>
        </div>
        <div class="mobiletext">
          <div class="valign lineheight2 mb-1">
            <div>
              <div>
                <a href="/users/<%= subPosts[j].subPostAuthor.id._id %>" class="darkgrey">
                  <strong><%= subPosts[j].subPostAuthor.id.fullName %></strong>
                </a>
              </div>
              <div class="lightgrey boldtext text-xxs"><%= rankTitle(userRank(subPosts[j].subPostAuthor.id._id)) %></div>
            </div>
            <div class="d-flex flex-column">
              <div class="darkgrey boldtext text-xxs mb-auto" style="margin-bottom: -0.3125rem !important;"><%= moment(subPosts[j].postedAt).format('lll'); %></div>
              <div class="dropdown ml-auto">
                <button class="btn btn-sm dropdown-toggle editprofile pr-0" style="padding-top: 0 !important; padding-bottom: 0 !important;" type="button" data-toggle="dropdown"><i class="fas fa-ellipsis-v text-xxxs"></i></button>
                <ul class="dropdown-menu dropdown-menu-right dropbox">
                  <div class="container drop-shadow1">
                    <li>
                      <form action="/clubs/<%= clubId %>/posts/<%= post._id %>/subPost/<%= bucket[0]._id %>" method="GET">
                        <button class="dropitems pl-3 link-button text-sm" name="quote" type="submit" value="<%= subPosts[j]._id %>">Quote</button>
                        <input type="hidden" name="_csrf" value="<%= csrfToken %>">
                      </form>
                    </li>
                    <li>
                      <form class="delete-form inline" action="" method="POST">
                        <button class="dropitems pl-3 link-button text-sm" type="submit" disabled style="color: darkgrey !important;">Flag inappropriate &#127988;</button>
                        <input type="hidden" name="_csrf" value="<%= csrfToken %>">
                      </form>
                    </li>
                  </div>
                </ul>
              </div>
            </div>
          </div>
          <hr>
        </div>
        <% if(subPosts[j].quoteText && subPosts[j].quoteText != ''){ %>
          <div class="quote px-1 pb-1 my-1 lineheight3 greyback">
            <span class="linewrap text-xs boldtext redcolor text-bitter">Quote:</span>
            <span class="linewrap text-xs"><strong># <%= subPosts[j].quoteNum %></strong></span>
            <span class="linewrap text-xs"><%= subPosts[j].quoteText %></span>
          </div>
        <% } %>
        <div class="mobiletext linewrap lineheight"><%= subPosts[j].text %></div>
        <% if(subPosts[j].images && subPosts[j].images.length){ %>
          <% for(var k=0;k<subPosts[j].images.length;k++){ %>
            <div class="subPostimg-div">
              <img class="card-img-top" src="<%= subPosts[j].images[k].image %>">
            </div>
          <% } %>
        <% } %>
      </div>
    </div>
  </div>
<% } %>

<% if(post.subpostBuckets.length >= 1){ %>
  <div class="valign mt-2">
    <div>
      <% if(index-1 > -1){ %>
        <span><a href="/clubs/<%= clubId %>/posts/<%= post._id %>/m-sP" class="load-subPosts-btn btn btn-dark mb-1 btnxs text-sm boldtext mx-1" value="<%= index-1 %>"> Prev </a></span>
      <% } %>
    </div>
    <div>
      <% if(index+1 < post.subpostBuckets.length){ %>
        <span><a href="/clubs/<%= clubId %>/posts/<%= post._id %>/m-sP" class="load-subPosts-btn btn btn-dark mb-1 btnxs text-sm boldtext mx-1" value="<%= index+1 %>"> Next </a></span>
      <% } %>
    </div>
  </div>
<% } %>

<% if(index == post.subpostBuckets.length-1){ %>
  <div class="card indexcard2">
    <div class="card-body3">
      <div class="valign">
        <div class="mb-auto d-flex flex-column">
          <div>
            <a href="/users/<%= currentUser._id %>"><img class="subpostdp my-1" src="<%= CU_50_profilePic %>"></a>
          </div>
          <div class="text-center darkgrey">#<%= post.subpostsCount+1 %></div>
        </div>
        <div class="commentdiv ml-2 d-flex flex-column">
          <form action="/clubs/<%= clubId %>/posts/<%= post._id %>/discussions" method="POST">
            <div class="valign mb-1">
              <div class="d-flex flex-column">
                <div class="darkgrey boldtext subpostbtn"><%= currentUser.fullName %></div>
                <div class="darkgrey boldtext subpostbtn text-xxs"><%= rankTitle(rank) %></div>
              </div>
              <div class="lightgrey boldtext text-xs subpostbtn py-1 mb-auto"><em><%= moment().format('LT'); %></em></div>
            </div>
            <div class="input-group">
              <textarea onclick="block_display('subpostbtn');" type="text" id="subpostbox" class="form-control nomargin mb-1 text-sm emoji-input" name="text" placeholder="Add your opinion" rows="4"></textarea>
            </div>
            <div class="d-flex flex-row-reverse">
              <button class="btn btn-sm btn-success subpostbtn btnshadow btnxs mt-2 ml-2" onclick="loading_spinner('load-subPostbutton','');"><span id="load-subPostbutton"></span>Submit</button>
              <button onclick="none_display('subpostbtn'); clear_subpost();" class="btn btn-secondary subpostbtn btnshadow subpostbtn<%= post._id %> btnxs text-sm ml-2 mt-2" type="button">Cancel</button>
              <label id="input-10" for="inputImage" class="custom-file-upload subpostbtn mt-2" title="Upload image">
                <i class="fas fa-upload"></i> Images<sup>10</sup>
              </label>
              <input type="file" id="inputImage" class="text-sm" name="images" accept="image/*">
            </div>
            <input type="hidden" name="_csrf" value="<%= csrfToken %>">
          </form>
        </div>
      </div>
    </div>
  </div>
<% } %>

<%
  function userRank(uid){
    var len = post.postClub.clubUsers.length;
    for(k=0;k<len;k++){
      if(post.postClub.clubUsers[k].id == uid){
        return post.postClub.clubUsers[k].userRank;
      }
    }
  }

  function rankTitle(rank){
    if(rank == 0){return 'President';}
    else if(rank == 1){return 'Admin';}
    else if(rank == 2){return 'Moderator';}
    else if(rank == 3){return 'Sr. member';}
    else if(rank == 4){return 'Jr. member';}
  }
%>
`,{post: response.post, subVotes: response.subVotes, bucket: response.bucket, index: Number(response.index),
  rank: Number(response.rank), currentUser: response.currentUser, clubId: response.clubId,
  CU_50_profilePic: response.CU_50_profilePic, sPA_50_profilePic: response.sPA_50_profilePic, 
  csrfToken: response.csrfToken});
  return html;
}

function moreMembers_template(response){
  html = ejs.render(`
<div class="row no-gutters lineheight2">
  <% for(var i=0;i<users.length;i++){ %>
    <div class="col-md-1 col-2 pt-2 pb-1 mb-auto">
      <a href="/users/<%= users[i].id._id %>">
        <% if(users[i].id.userKeys.sex == 'Male'){ %>
          <img class="navdp rounded-circle" src="<%= Users_50_profilePic[i] || '/images/noUserMale.png' %>">
        <% } else if(users[i].id.userKeys.sex == 'Female'){ %>
          <img class="navdp rounded-circle" src="<%= Users_50_profilePic[i] || '/images/noUserFemale.png' %>">
        <% } %>
      </a>
    </div>
    <div class="col-md-8 col-8 my-auto pt-2 pb-1">
      <span>
        <a href="/users/<%= users[i].id._id %>" class="grey mobiletext">
          <strong><%= users[i].id.fullName %></strong>
        </a>
      </span>
      <span class="my-auto lightgrey text-xs mobiletext4">
        <%= users[i].userStatus %>
      </span>
    </div>
    <div class="col-md-3 col-2 my-auto text-right">
      <div class="d-inline-flex">
        <span class="mobileNone">
          <em class="darkgrey text-sm"><%= rankTitle(users[i].userRank) %></em>
        </span>
        <span class="mobileShow">
          <em class="darkgrey text-xs"><%= rankTitle2(users[i].userRank) %></em>
        </span>
      </div>
      <span id="user_Rank<%= users[i].id._id %>" class="user_Rank nopad">
        <form action="/status-rank?_method=PUT" method="POST" class="form-inline">
          <label for="userRank" class="sr-only">User rank</label>
          <select id="userRank<%= users[i].id._id %>" name="userRank" class="shortened-select select4" data-toggle="tooltip" title="User rank" onchange="this.form.submit()">
            <option value="-1" data-descr="" disabled selected>&#x25BC;</option>
            <% if(rank == 0){ %>
              <option value="0,<%= users[i].id._id %>,<%= club._id %>" data-descr="President">President</option>
            <% } %>
            <option value="1,<%= users[i].id._id %>,<%= clubId %>" data-descr="Administrator">Admin</option>
            <option value="2,<%= users[i].id._id %>,<%= clubId %>" data-descr="Moderator">Mod.</option>
            <option value="3,<%= users[i].id._id %>,<%= clubId %>" data-descr="Sr. Member">Sr. M</option>
            <option value="4,<%= users[i].id._id %>,<%= clubId %>" data-descr="Jr. Member">Jr. M</option>
          </select>
          <input type="hidden" name="_csrf" value="<%= csrfToken %>">
        </form>
      </span>
      <% if(users[i].userRank == 0 && 0 <= rank && rank <= 1){ %>
        <span class="dropdown">
          <button class="btn btn-sm dropdown-toggle text-xxs ellipsis-sm nopoint" type="button"><i></i></button>
        </span>
      <% } else{ %>
        <span class="dropdown nopad">
          <% if(0 <= rank && rank <= 1){ %>
            <button class="btn btn-sm dropdown-toggle text-xxs ellipsis-sm" type="button" data-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
          <% } %>
          <% if(users[i].userRank != 0){ %>
            <ul class="dropdown-menu dropdown-menu-right dropbox">
              <div class="container drop-shadow1">
                <li onclick="toggle_inline_display('user_Rank<%= users[i].id._id %>');"><a class="dropitems text-sm" href="#!">Set user rank</a></li>
                <hr>
                <li>
                  <button class="dropitems link-button red text-sm" href="#removeClubMemberModal<%= users[i].id._id %><%= club._id %>" data-toggle="modal">Remove <%= users[i].id.firstName %></button>
                </li>
              </div>
            </ul>
          <% } %>
        </span>
        <!-- Modal HTML -->
        <div id="removeClubMemberModal<%= users[i].id._id %><%= club._id %>" class="fixed-padding modal fade">
          <div class="modal-dialog modal-confirm">
            <div class="modal-content">
              <div class="d-flex">
                <span class="icon-box">
                  <i class="fas fa-exclamation-triangle text-xxxl"></i>
                </span>              
                <span class="my-auto"><h5 class="modal-title">Are you sure?</h5></span>
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
              </div>
              <div>
                <p>Do you really want to remove <%= users[i].id.firstName %>? This cannot be undone.</p>
              </div>
              <div class="my-2">
                <button type="button" class="btn btn-secondary btn-sm mr-1" data-dismiss="modal">Cancel</button>
                <form action="/status-rank?_method=PUT" method="POST" class="delete-form inline text-sm">
                  <button type="submit" name="leave" value="<%= users[i].id._id %>,<%= club._id %>" class="btn btn-danger btn-sm ml-1">Remove</button>
                  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
                </form>
              </div>
            </div>
          </div>
        </div>
      <% } %>
    </div>
  <% } %>
</div>

<%
  function rankTitle(rank){
    if(rank == 0){return 'President';}
    else if(rank == 1){return 'Admin';}
    else if(rank == 2){return 'Moderator';}
    else if(rank == 3){return 'Sr. member';}
    else if(rank == 4){return 'Jr. member';}
  }

  function rankTitle2(rank){
    if(rank == 0){return 'Pr';}
    else if(rank == 1){return 'Ad';}
    else if(rank == 2){return 'Mo';}
    else if(rank == 3){return 'Sr';}
    else if(rank == 4){return 'Jr';}
  }
%>
`,{users: response.users, Users_50_profilePic: response.Users_50_profilePic, 
  newEndpoints: response.newEndpoints, clubId: response.clubId, rank: response.rank, 
  csrfToken: response.csrfToken});
  return html;
}

function moreMemberRequests_template(response){
  html = ejs.render(`
<div class="row no-gutters mt-2 lineheight2">
  <% for(var m=0;m<users.length;m++){ %>
    <div class="col-md-1 col-2 py-1 mb-auto">
      <a href="/users/<%= club.memberRequests[m].userId._id %>">
        <% if(club.memberRequests[m].userId.userKeys.sex == 'Male'){ %>
          <img class="navdp rounded-circle" src="<%= MemberRequests_50_profilePic[m] || '/images/noUserMale.png' %>">
        <% } else if(club.memberRequests[m].userId.userKeys.sex == 'Female'){ %>
          <img class="navdp rounded-circle" src="<%= MemberRequests_50_profilePic[m] || '/images/noUserFemale.png' %>">
        <% } %>
      </a>
    </div>
    <div class="col-md-6 col-6 my-auto">
      <span>
        <a href="/users/<%= club.memberRequests[m].userId._id %>" class="mobiletext2 grey">
          <strong><%= club.memberRequests[m].userId.fullName %></strong>
        </a>
      </span>
      <span class="my-auto lightgrey text-xs">
        <%= club.memberRequests[m].message %>
      </span>
    </div>
    <div class="col-md-5 col-4 d-flex">
      <div class="ml-auto mb-auto">
        <form action="/clubs/<%= club._id %>/member_requests?_method=PUT" method="POST" class="form-inline pt-2">
          <span>
            <button class="btn btnxs btn-primary text-sm" type="submit" name="acceptReq" value="<%= club.memberRequests[m].userId._id %>">Invite</button>
          </span>
          <span>
            <button class="btn btnxs btn-secondary text-sm" type="submit" name="declineReq" value="<%= club.memberRequests[m].userId._id %>">Decline</button>
          </span>
          <input type="hidden" name="_csrf" value="<%= csrfToken %>">
        </form>
      </div>
    </div>
  <% } %>
</div>
`,{users: response.users, MemberRequests_50_profilePic: response.MemberRequests_50_profilePic, 
  newEndpoints: response.newEndpoints, club: response.club, csrfToken: response.csrfToken});
  return html;
}

function allTimeTopTopicPosts_template(response){
  html = ejs.render(`
<% if(topTopicPosts.length != 0){ %>
  <% for(var i=0;i<topTopicPosts.length;i++){ %>
  <div class="valign">
    <div class="valign">
      <% if(Posts_50_Image && Posts_50_Image[i] == null){ %>
        <span class="truncate3 mobiletext2 lineheight2 my-1">
          <span class="badge">[<%= topTopicPosts[i].subpostsCount %>]</span>
          <span class="linewrap"><a class="darkgrey" href="/clubs/<%= club._id %>/posts/<%= topTopicPosts[i]._id %>"><%= topTopicPosts[i].topic %></a></span>
        </span>
      <% } else if(Posts_50_Image && Posts_50_Image[i] != null){ %>
        <div>
          <a href="/clubs/<%= club._id %>/posts/<%= topTopicPosts[i]._id %>"><img class="collegedp my-1 mr-2" src="<%= Posts_50_Image[i] || '/images/noClub.png' %>"></a>
        </div>
        <div>
          <span class="truncate3 mobiletext2 lineheight2 my-1">
            <span class="badge">[<%= topTopicPosts[i].subpostsCount %>]</span>
            <span class="linewrap"><a class="darkgrey" href="/clubs/<%= club._id %>/posts/<%= topTopicPosts[i]._id %>"><%= topTopicPosts[i].topic %></a></span>
          </span>
        </div>
      <% } %>
    </div>
    <div class="mb-auto ml-2 mt-1 badge badge-pill badge-round2 badge-secondary text-md"><%= Number(topTopicPosts[i].upVoteCount)-Number(topTopicPosts[i].downVoteCount) %></div>
  </div>
  <% } %>
<% } else{ %>
  <div class="lightgrey mobiletext2">No discussions created yet :/</div>
<% } %>
`,{topTopicPosts: response.topTopicPosts, Posts_50_Image: response.Posts_50_Image, 
  csrfToken: response.csrfToken});
  return html;
}

function moreClubs_template(response){
  html = ejs.render(`
<div class="row no-gutters lineheight2">
  <% for(var i=0;i<clubs.length;i++){ %>
    <div class="col-md-1 col-2 pt-2 pb-1 mb-auto">
      <a href="/clubs/<%= clubs[i].id._id %>">
      <img class="navdp rounded-circle" src="<%= Clubs_50_clubAvatar[i] || '/images/noClub.png' %>"></a>
    </div>
    <div class="col-md-9 col-8 my-auto pt-2 pb-1">
      <span>
        <a href="/clubs/<%= clubs[i].id._id %>" class="grey mobiletext">
          <strong><%= clubs[i].id.name %></strong>
        </a>
      </span>
      <span class="my-auto lightgrey text-xs mobiletext4">
        <%= clubs[i].status %>
        <div class="status" id="status<%= clubs[i].id._id %>">
          <form action="/status-rank?_method=PUT" method="POST">
            <div class="input-group mt-1 mb-5">
              <input type="text" name="status" class="commentbox1 text-sm form-control form-control-sm" placeholder="<%= clubs[i].status %>">
              <div class="input-group-append">
                <button class="btn btn-secondary btnxxs text-xs" type="submit" name="statusId" value="<%= userId %>,<%= clubs[i].id._id %>">Update</button>
              </div>
            </div>
            <input type="hidden" name="_csrf" value="<%= csrfToken %>">
          </form>
        </div>
      </span>
    </div>
    <div class="col-md-2 col-2 my-auto text-right">
      <div class="d-inline-flex">
        <span class="mobileNone">
          <em class="darkgrey text-sm"><%= rankTitle(clubs[i].rank) %></em>
        </span>
        <span class="mobileShow">
          <em class="darkgrey text-xs"><%= rankTitle2(clubs[i].rank) %></em>
        </span>
      </div>
      <span class="dropdown">
        <% if(currentUserId && match){ %>
          <button class="btn btn-sm dropdown-toggle text-xs ellipsis-sm" type="button" data-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
        <% } %>
        <ul class="dropdown-menu dropdown-menu-right dropbox">
          <div class="container drop-shadow1">
            <li><a class="dropitems text-sm" href="#!" onclick="toggle_display('status<%= clubs[i].id._id %>')">Update status</a></li>
            <% if(clubs[i].rank != 0){ %>
              <hr>
              <li>
                <button class="dropitems link-button red text-sm" href="#leaveClubModal<%= userId %><%= clubs[i].id._id %>" data-toggle="modal">Leave <%= clubs[i].id.name %></button>
              </li>
            <% } %>
          </div>
        </ul>
      </span>
      <!-- Modal HTML -->
      <div id="leaveClubModal<%= userId %><%= clubs[i].id._id %>" class="fixed-padding modal fade">
        <div class="modal-dialog modal-confirm">
          <div class="modal-content">
            <div class="d-flex">
              <span class="icon-box">
                <i class="fas fa-exclamation-triangle text-xxxl"></i>
              </span>              
              <span class="my-auto"><h5 class="modal-title">Are you sure?</h5></span>
              <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
            </div>
            <div>
              <p>Do you really want to leave <%= clubs[i].id.name %>? This cannot be undone.</p>
            </div>
            <div class="my-2">
              <button type="button" class="btn btn-secondary btn-sm mr-1" data-dismiss="modal">Cancel</button>
              <form action="/status-rank?_method=PUT" method="POST" class="delete-form inline text-sm">
                <button type="submit" name="leave" value="<%= userId %>,<%= clubs[i].id._id %>" class="btn btn-danger btn-sm ml-1">Leave</button>
                <input type="hidden" name="_csrf" value="<%= csrfToken %>">
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  <% } %>
</div>

<%
  function rankTitle(rank){
    if(rank == 0){return 'President';}
    else if(rank == 1){return 'Admin';}
    else if(rank == 2){return 'Moderator';}
    else if(rank == 3){return 'Sr. member';}
    else if(rank == 4){return 'Jr. member';}
  }

  function rankTitle2(rank){
    if(rank == 0){return 'Pr';}
    else if(rank == 1){return 'Ad';}
    else if(rank == 2){return 'Mo';}
    else if(rank == 3){return 'Sr';}
    else if(rank == 4){return 'Jr';}
  }
%>
`,{clubs: response.clubs, clubCount: response.clubCount, Clubs_50_clubAvatar: response.Clubs_50_clubAvatar,
  newEndpoints: response.newEndpoints, userId: response.userId, rank: response.rank,
  currentUserId: response.currentUserId, match: response.match, csrfToken: response.csrfToken});
  return html;
}

function search_people_template(response){
  html = ejs.render(`
<% var len = users.length; var k=0; for(k;k<len;k++){ %>
  <div class="card searchcard2 border-light">
    <div class="d-flex flex-row">
      <div>
        <a href="/users/<%= users[k]._id %>">
          <% if(users[k].userKeys.sex == 'Male'){ %>
            <img class="searchdp" src="<%= Users_100_profilePic[k] || '/images/noUserMale.png' %>">
          <% } else if(users[k].userKeys.sex == 'Female'){ %>
            <img class="searchdp" src="<%= Users_100_profilePic[k] || '/images/noUserFemale.png' %>">
          <% } %>
        </a>
      </div>
      <div class="card-body3 lineheight2 fullwidth" style="overflow: hidden;">
        <div class="valign">
          <div>
            <a href="/users/<%= users[k]._id %>" class="grey">
              <span class="nothing text-lg"><strong class="searchname"><% if(!users[k].isVerified){ %><span class="text-xxl redcolor">*</span><% } %><%= users[k].fullName %></strong></span>
            </a>
          </div>
          <div>
            <% if(currentUser && users[k]._id == currentUser._id){ %>
              <button class="btn btn-white btnxxs text-sm noshadow nopoint search-topright" type="button">
                <i class="fas fa-ghost" aria-hidden="true"></i></button>
            <% } else if(currentUser && !(users[k]._id == currentUser._id)){ 
              currentUser.friends.forEach(function(friend){ 
                if(users[k]._id == friend){ %>
                <button class="btn btn-white btnxxs text-sm noshadow nopoint search-topright" type="button">
                  <i class="fas fa-check"></i></button>
            <% }})} %>
          </div>
        </div>
        <div class="lightgrey text-xs pr-3"><%= users[k].note %></div>
        <br>
        <div class="valign search-bottompos search-bottompos-desktop">
          <div class="mt-auto">
            <div class="text-xs mobiletext4 mobilebold darkgrey"><%= users[k].userKeys.college %></div>
            <% if(users[k].userKeys){ %>
              <div class="lightgrey text-xs mobiletext4"><%= users[k].userKeys.school %></div>
            <% } %>
          </div>
          <% if(users[k].userKeys){ %>
            <div class="darkgrey text-xs mobiletext4 mt-auto text-right lineheight2 ml-1" style="max-width: 30%;"><%= users[k].userKeys.residence %></div>
          <% } %>
        </div>
      </div>
    </div>
  </div>
<% } %>
`,{users: response.users, query: response.query, foundUserIds: response.foundUserIds, 
  currentUser: response.currentUser, Users_100_profilePic: response.Users_100_profilePic, 
  csrfToken: response.csrfToken});
  return html;
}

function search_clubs_template(response){
  html = ejs.render(`
<% var len = clubs.length; var k=0; for(k;k<len;k++){ %>
  <div class="card searchcard2 border-light">
    <div class="d-flex flex-row">
      <div>
        <a href="/clubs/<%= clubs[k]._id %>">
          <img class="searchdp" src="<%= Clubs_100_Avatar[k] || '/images/noClub.png' %>">
        </a>
      </div>
      <div class="card-body3 lineheight2 fullwidth" style="overflow: hidden;">
        <div class="valign">
          <div>
            <a href="/clubs/<%= clubs[k]._id %>" class="grey">
              <span class="nothing text-lg"><strong class="searchname"><%= clubs[k].name %></strong></span>
            </a>
          </div>
          <div>
            <% if(currentUser){ 
              currentUser.userClubs.forEach(function(userClub){ 
                if(clubs[k]._id == userClub.id){ %>
                <button class="btn btn-white btnxxs text-sm noshadow nopoint search-topright" type="button">
                  <i class="fas fa-check"></i></button>
            <% }})} %>
          </div>
        </div>
        <div class="lightgrey text-xs pr-3"><%= clubs[k].banner %></div>
        <br>
        <div class="valign search-bottompos search-bottompos-desktop">
          <div class="mt-auto">
            <% if(clubs[k].clubKeys){ %>
              <div class="text-xs mobiletext4 boldtext darkgrey"><%= clubs[k].clubKeys.category %></div>
            <% } %>
          </div>
          <% if(clubs[k].clubKeys){ %>
            <div class="darkgrey text-xs mobiletext4 mt-auto text-right lineheight2 ml-1" style="max-width: 30%;"><%= clubs[k].clubKeys.college %></div>
          <% } %>
        </div>
      </div>
    </div>
  </div>
<% } %>

<%
function break_arr(arr){
  if(arr && arr.length){
    for(i=0;i<arr.length;i++){
      if(i == 0){
        var str = arr[i];
      } else{
        var str = str +', '+ arr[i];
      }
    }
    return str;
  } else{
    return '';
  }
}
%>
`,{clubs: response.clubs, query: response.query, foundClubIds: response.foundClubIds, 
  currentUser: response.currentUser, Clubs_100_Avatar: response.Clubs_100_Avatar, 
  csrfToken: response.csrfToken});
  return html;
}

function search_college_pages_template(response){
  html = ejs.render(`
<% var len = college_pages.length; var k=0; for(k;k<len;k++){ %>
  <div class="card searchcard2 border-light">
    <div class="d-flex flex-row">
      <div class="card-body3 lineheight1 fullwidth">
        <div class="notification px-2 py-1 college d-flex flex-column">
          <div class="boldtext text-xxl">
            <div class="collegename-search d-flex">
              <span>
                <% if(matchArr[k]){ %>
                  <sup class="greencolor text-xs pb-auto">My </sup>
                <% } %>
                <a href="/college_pages/<%= college_pages[k].name %>" class="black">
                  <i class="fas fa-university lightgrey"></i>
                  <span id="copyTxt"><%= college_pages[k].name %></span>
                </a>
              </span>
              <div class="tooltip">
              <button class="copyBtn ml-3" onclick="copyTxtFn()" onmouseout="outCopyTxtFn()">
                <span class="tooltiptext" id="myTooltip">Copy to clipboard</span>
                <i class="far fa-copy lightgrey"></i>
                </button>
              </div>
            </div>
          </div>
          <span class="badge text-sm"><%= college_pages[k].userCount %></span>
        </div>
        <br>
        <div class="lightgrey text-sm">
          <span><span class="boldtext text-md"><%= college_pages[k].clubCount %></span> clubs</span>
        </div>
      </div>
    </div>
  </div>
<% } %>
`,{college_pages: response.college_pages, query: response.query, foundCollegePageIds: response.foundCollegePageIds, 
  matchArr: response.matchArr, csrfToken: response.csrfToken});
  return html;
}

function showFollowing_template(response){
  html = ejs.render(`
<% if(followingClubs.length){ %>
  <div class="lightgrey text">
    <span>+ Clubs: </span>
    <br>
    <span>
      <% var len = followingClubs.length; for(var i=len-1;i>=0;i--){ %>
        <% if(i==0 && i==len-1){ %>
          <span class="nothing"><a href="/clubs/<%= followingClubs[i]._id %>"><%= followingClubs[i].name %></a></span>
          <br>
          <% } else if(i==len-1){ %>
          <span class="nothing"><a href="/clubs/<%= followingClubs[i]._id %>"><%= followingClubs[i].name %></a>,</span>
          <br>
          <% } else if(i>0 && i<len){ %>
          <span class="nothing"><a href="/clubs/<%= followingClubs[i]._id %>"><%= followingClubs[i].name %></a>,</span>
          <br>
          <% } else if(i==0){ %>
          <span class="nothing"><a href="/clubs/<%= followingClubs[i]._id %>"><%= followingClubs[i].name %></a></span>
          <br>
      <% }} %>
    </span>
    <br>
  </div>
<% } %>
`,{followingClubs: response.followingClubs, csrfToken: response.csrfToken});
  return html;
}