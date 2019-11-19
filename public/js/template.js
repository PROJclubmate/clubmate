if(location.pathname == '/home'){
  // Client side rendering
  window.onload=function(){
    document.getElementById('load-more-btn').click();
  };
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
        if(arr && arr != '' && response.arrLength){
          // If server + client side rendering is used
          if($('#load-more-btn').val() != ''){
          //   $('#load-more-btn').val(arr.concat($('#load-more-btn').val()));
          //   var div = document.getElementById('client-posts');
          //   div.innerHTML += index_posts_template(response);
          // Only client side rendering
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
  };
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
        if(arr && arr != '' && response.arrLength){
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
  };
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
        if(arr && arr != '' && response.arrLength){
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
  };
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
        if(arr && arr != '' && response.arrLength){
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

  $('#load-prevMsgs-btn').on('click', function(e){
    e.preventDefault();
    const conversationId = $("#club-convoId").attr("value").split(',')[0];
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
}

if(location.pathname.split('/').length == 3 && location.pathname.split('/')[1] == 'users' && 
  location.pathname.split('/')[2].match(/^[a-fA-F0-9]{24}$/)){
  // Last message mobile
  if($(window).width() < 768){
    if($('#lastMsg-hidden') && $('#lastMsg-hidden').text() != ''){
      $('#lastMsg').addClass("nodisplay");
      $('#lastMsg-hidden').removeClass("nodisplay");
    }
    $('#drop-chat').on('click', function(e){
      $('#lastMsg').toggleClass("nodisplay");
      $('#lastMsg-hidden').toggleClass("nodisplay");
    });
  }
  window.onload=function(){
    document.getElementById('load-more-btn').click();
  };
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
        if(arr && arr != '' && response.arrLength){
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
          if(arr && arr != '' && response.arrLength){
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

  $('#load-prevMsgs-btn').on('click', function(e){
    e.preventDefault();
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
        } else{
          $('#load-more-clubs-btn').addClass('nodisplay');
        }
        $('#load-more-clubs-btn').html('<span id="load-more-clubs-span"></span>Load More').blur();
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
    // history.pushState({url: url, value: value}, '', url);
    load_subPost_page(url,value);
  });
  // OR
  $('#dynamic-subPosts').on('click', '#page-index-button', function(e){
    e.preventDefault();
    var value = $('#page-index-input').val()-1;
    var url = $('#page-index-input').attr('href'); 
    // history.pushState({url: url, value: value}, '', url);
    load_subPost_page(url,value);
  });
}

// window.addEventListener('popstate', e => {
//   if(e.state != null){
//     load_subPost_page(e.state.url,e.state.value);
//   } else{
//     load_subPost_page(null,null);
//   }
// })

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

if(location.pathname.split('/').length == 3 && location.pathname.split('/')[1] == 'find_org_pages'){
  $('#load-more-search-org_pages-btn').on('click', function(e){
    e.preventDefault();
    $('#load-more-search-org_pages-span').addClass("spinner-border spinner-border-sm mr-1");
    var query = $('#query').attr('value');
    $.ajax({
      type: 'GET',
      url: '/org_pages-moreResults/search/'+query,
      data: {ids: $('#load-more-search-org_pages-btn').val()},
      timeout: 3000,
      success: function (response){
        var arr = response.foundOrgPageIds;
        if(arr && arr != ''){
          if($('#load-more-search-org_pages-btn').val() != ''){
            $('#load-more-search-org_pages-btn').val(arr.concat($('#load-more-search-org_pages-btn').val()));
            var div = document.getElementById('client-search-org_pages');
            div.innerHTML += search_org_pages_template(response);
          } else{
            $('#load-more-search-org_pages-btn').val(arr);
          }
        } else{
          $('#load-more-search-org_pages-btn').addClass('nodisplay');
        }
        $('#load-more-search-org_pages-btn').html('<span id="load-more-search-org_pages-span"></span>Load More').blur();
      }
    });
  });
}

function load_prevMsgs_template(response){
  html = ejs.render(`
<% var prevDate; %>
<% messageBucket.messages.forEach(function(message){ %>
  <% if(moment(message.createdAt).format("MMM Do YY") != prevDate){ %>
    <div class="chat-head3"><%= moment(message.createdAt).format("MMM Do YY") %></div>
  <% } %>
  <% prevDate = moment(message.createdAt).format("MMM Do YY"); %>
  <% if(message.authorId == currentUser){ %>
    <div class="flex-end"><div class="chat-msg2"><div><%= message.text %></div><div class="chat-head2">
       <%= moment(message.createdAt).format('LT') %></div></div></div>
  <% } else{ %>
    <div><div class="chat-msg"><div><%= message.text %></div><div class="chat-head">
      <%= moment(message.createdAt).format('LT') %></div></div></div>
  <% } %>
<% }); %>
`,{messageBucket: response.messageBucket, currentUser: response.currentUser});
  return html;
}

function load_prevClubMsgs_template(response){
  html = ejs.render(`
<% var prevDate; %>
<% messageBucket.messages.forEach(function(message){ %>
  <% if(moment(message.createdAt).format("MMM Do YY") != prevDate){ %>
    <div class="chat-head3"><%= moment(message.createdAt).format("MMM Do YY") %></div>
  <% } %>
  <% prevDate = moment(message.createdAt).format("MMM Do YY"); %>
  <% if(message.authorId == currentUser){ %>
    <div class="flex-end"><div class="chat-msg2"><div class="chat-head2"><%= firstName %>
      <%= moment(message.createdAt).format('LT') %></div><div><%= message.text %></div> </div></div>
  <% } else{ %>
    <div><div class="chat-msg"><div class="chat-head bluecolor"><%= message.authorName %>
      <%= moment(message.createdAt).format('LT') %></div><div><%= message.text %></div> </div></div>
  <% } %>
<% }); %>
`,{messageBucket: response.messageBucket, currentUser: response.currentUser, firstName: response.firstName});
  return html;
}

function index_posts_template(response){
  html = ejs.render(`
<% var len = posts.length; var k=0; for(k;k<len;k++){ %>
  <% if(posts[k].topic == ''){ %>
    <div class="card">
  <% } else{ %>
    <div class="card topic-body">
  <% } %>
    <div class="card-body">
      <div class="dropctn">
        <div class="valign">
          <div>
            <% if(!friendsPostUrl){ %>
              <a href="/clubs/<%= posts[k].postClub._id %>"><img class="navdp rounded-circle mr-2" src="<%= PC_50_clubAvatar[k] || '/images/noClub.png' %>"></a>
            <% } else{ %>
              <a href="/users/<%= posts[k].postAuthor.id._id %>"><img class="navdp rounded-circle mr-2" src="<%= PA_50_profilePic[k] || '/images/noUser.png' %>"></a>
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
              <em class="text-xxs lightgrey">. <%= moment(posts[k].createdAt).fromNow() %></em>
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
                <% }; %>
              </div>
            </ul>
            <% if(currentUser._id == posts[k].postAuthor.id){ %>
              <!-- Modal HTML -->
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
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            <% }; %>
          </div>
        <% }; %>
      </div>
    </div>
    <% if(posts[k].topic == ''){ %>
      <% if(posts[k].image){ %>
        <% if(!friendsPostUrl){ %>
          <a href="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>">
        <% } else{ %>
          <a href="/clubs/<%= posts[k].postClub %>/posts/<%= posts[k]._id %>">
        <% } %>
          <div><img class="card-img-top postimg" src="<%= posts[k].image %>"></div>
        </a>
        <div class="card-body">
          <p class="truncate nothing mobiletext linewrap"><%= posts[k].description %></p>
        </div>
        <hr>
      <% } else{ %>
        <div class="card-body2 nounderline nothing">
          <% if(!friendsPostUrl){ %>
            <a href="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>">
          <% } else{ %>
            <a href="/clubs/<%= posts[k].postClub %>/posts/<%= posts[k]._id %>">
          <% } %>
            <p class="truncate2 nothing mobiletext linewrap nolink"><%= posts[k].description %></p>
          </a>
        </div>
        <hr>
      <% } %>
      <div class="card-body3">
        <form class="post-vote-form valign" action="/posts/<%= posts[k]._id %>/vote" method="POST">
          <div class="valign">
            <% if(currentUser){ %>
              <% if(hasVote[k] == 1){ %>
                <span class="d-flex mr-1"> 
                  <button id="like-btn<%= posts[k]._id %>" class="vote likebtn" name="like" type="submit" value="like" title="Like"><i class="fas fa-thumbs-up greencolor"></i></button>
                </span>
                <span id="like-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm greencolor"><%= posts[k].likeCount %></span>
                <span class="d-flex ml-2 mr-1">
                  <button id="dislike-btn<%= posts[k]._id %>" class="vote dislikebtn" name="dislike" type="submit" value="dislike" title="Dislike"><i class="far fa-thumbs-down"></i></button>
                </span>
                <span id="dislike-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].dislikeCount %></span>
              <% } else if(hasVote[k] == -1){ %>
                <span class="d-flex mr-1"> 
                  <button id="like-btn<%= posts[k]._id %>" class="vote likebtn" name="like" type="submit" value="like" title="Like"><i class="far fa-thumbs-up"></i></button>
                </span>
                <span id="like-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].likeCount %></span>
                <span class="d-flex ml-2 mr-1">
                  <button id="dislike-btn<%= posts[k]._id %>" class="vote dislikebtn" name="dislike" type="submit" value="dislike" title="Dislike"><i class="fas fa-thumbs-down blackcolor"></i></button>
                </span>
                <span id="dislike-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm blackcolor"><%= posts[k].dislikeCount %></span>
              <% } else if(hasVote[k] == 0 || hasVote[k] == 3){ %>
                <span class="d-flex mr-1"> 
                  <button id="like-btn<%= posts[k]._id %>" class="vote likebtn" name="like" type="submit" value="like" title="Like"><i class="far fa-thumbs-up"></i></button>
                </span>
                <span id="like-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].likeCount %></span>
                <span class="d-flex ml-2 mr-1">
                  <button id="dislike-btn<%= posts[k]._id %>" class="vote dislikebtn" name="dislike" type="submit" value="dislike" title="Dislike"><i class="far fa-thumbs-down"></i></button>
                </span>
                <span id="dislike-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].dislikeCount %></span>
              <% } %>
            <% }else{ %>
              <span class="d-flex mr-1"> 
                <button id="like-btn<%= posts[k]._id %>" class="vote" name="like" type="submit" value="like" title="Like"><i class="fas fa-thumbs-up"></i></button>
              </span>
              <span id="like-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].likeCount %></span>
              <span class="d-flex ml-2 mr-1">
                <button id="dislike-btn<%= posts[k]._id %>" class="vote" name="dislike" type="submit" value="dislike" title="Dislike"><i class="fas fa-thumbs-down"></i></button>
              </span>
              <span id="dislike-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].dislikeCount %></span>
            <% } %>
          </div>
        
          <div class="valign">
            <% if(currentUser){ %>
              <% if(hasVote[k] == 3){ %>
                <span id="heart-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm redcolor"><%= posts[k].heartCount %></span>
                <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart redcolor"></i></button></span>
              <% } else if(hasVote[k] == 0 || hasVote[k] == 1 || hasVote[k] == -1){ %>
                <span id="heart-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].heartCount %></span>
                <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart"></i></button></span>
                <% } %>
            <% }else{ %>
              <span id="heart-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].heartCount %></span>
              <span><button id="heart-btn<%= posts[k]._id %>" class="vote" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart"></i></button></span>
            <% } %>
          </div>
        </form>
      </div>
    <% } else{ %>
      <!-- POSTS WITH TOPIC AND FURTHER DISCUSSION -->
      <div class="nounderline nothing">
        <div class="valign topic-head">
          <div class="mx-2 mb-auto">
            <h5 class="nothing topic-h5"><%= posts[k].topic %></h5>
          </div>
          <!-- UP/DOWN VOTE -->
          <div class="mx-2 mb-auto d-flex flex-column">
            <form class="d-flex flex-column post-modvote-form" action="/posts/<%= posts[k]._id %>/modvote" method="POST">
              <% if(hasModVote[k] == 1){%>
                <button id="upVote-btn<%= posts[k]._id %>" class="modvote upVotebtn bluecolor" name="upVote" type="submit" value="up" title="Upvote"><i class="fas fa-caret-up lineheight3"></i></button>
                <span id="modVote-count<%= posts[k]._id %>" class="boldtext nothing text-xs text-center bluecolor"><%= posts[k].upVoteCount - posts[k].downVoteCount %></span>
                <button id="downVote-btn<%= posts[k]._id %>" class="modvote downVotebtn" name="downVote" type="submit" value="down" title="Downvote"><i class="fas fa-caret-down lineheight3"></i></button>
              <% } else if(hasModVote[k] == -1){ %>
                <button id="upVote-btn<%= posts[k]._id %>" class="modvote upVotebtn" name="upVote" type="submit" value="up" title="Upvote"><i class="fas fa-caret-up lineheight3"></i></button>
                <span id="modVote-count<%= posts[k]._id %>" class="boldtext nothing text-xs text-center orangecolor"><%= posts[k].upVoteCount - posts[k].downVoteCount %></span>
                <button id="downVote-btn<%= posts[k]._id %>" class="modvote downVotebtn orangecolor" name="downVote" type="submit" value="down" title="Downvote"><i class="fas fa-caret-down lineheight3"></i></button>
              <% } else if(hasModVote[k] == 0){ %>
                <button id="upVote-btn<%= posts[k]._id %>" class="modvote upVotebtn" name="upVote" type="submit" value="up" title="Upvote"><i class="fas fa-caret-up lineheight3"></i></button>
                <span id="modVote-count<%= posts[k]._id %>" class="boldtext darkgrey nothing text-xs text-center"><%= posts[k].upVoteCount - posts[k].downVoteCount %></span>
                <button id="downVote-btn<%= posts[k]._id %>" class="modvote downVotebtn" name="downVote" type="submit" value="down" title="Downvote"><i class="fas fa-caret-down lineheight3"></i></button>
              <% } %>
            </form>
          </div>
        </div>
        <% if(posts[k].image){ %>
          <div class="truncate nothing mobiletext linewrap card-body3"><%= posts[k].description %></div>
          <% if(!friendsPostUrl){ %>
            <a href="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>">
          <% } else{ %>
            <a href="/clubs/<%= posts[k].postClub %>/posts/<%= posts[k]._id %>">
          <% } %>
            <div><img class="card-img-top postimg" src="<%= posts[k].image %>"></div>
          </a>
        <% } else{ %>
          <% if(!friendsPostUrl){ %>
            <a href="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>">
          <% } else{ %>
            <a href="/clubs/<%= posts[k].postClub %>/posts/<%= posts[k]._id %>">
          <% } %>
            <div class="truncate2 card-body3 mobiletext linewrap nolink"><%= posts[k].description %></div>
          </a>
        <% } %>
      </div>
      <hr>
      <!-- Vote bar -->
      <div class="card-body3">
        <form class="post-vote-form valign" action="/posts/<%= posts[k]._id %>/vote" method="POST">
          <div class="valign">
            <span class="lightgrey text-sm"><strong><%= posts[k].subpostsCount %></strong> subPosts</span>
          </div>
          <div class="valign">
            <% if(currentUser){ %>
              <% if(hasVote[k] == 3){ %>
                <span id="heart-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm redcolor"><%= posts[k].heartCount %></span>
                <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart redcolor"></i></button></span>
              <% } else if(hasVote[k] == 0 || hasVote[k] == 1 || hasVote[k] == -1){ %>
                <span id="heart-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].heartCount %></span>
                <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart"></i></button></span>
                <% } %>
                  <span class="nodisplay" id="modVisibility<%= posts[k]._id %>"></span>
            <% } else{ %>
              <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart"></i></button></span>
            <% } %>
          </div>
        </form>
      </div>
    <% } %>
  </div>
  <!-- COMMENTS -->
  <% if(posts[k].topic == ''){ %>
    <div class="card indexcard2">
      <% if(posts[k].commentsCount != 0){ %>
        <div class="card-body3">
          <% var z=1; var buckets = posts[k].commentBuckets; var len1 = buckets.length; var i; for(i=len1-1;i>=0;i--){%>
            <% var comments = buckets[i].comments; var len2 = comments.length; var j; for(j=len2-1;j>=0;j--){%>
            <% if(z<=2){ %>
              <div class="valign">
                <div class="wordwrap">
                  <span><a href="/users/<%= comments[j].commentAuthor.id %>" class="black"><span class="nothing mobiletext boldtext"><%= comments[j].commentAuthor.authorName %></span></a>
                  </span>
                  <span class="mobiletext"><%= comments[j].text %></span>
                </div>
                <div class="d-flex flex-row-reverse valign mb-auto pt-2">
                  <span class="text-xs text-center boldtext lightgrey"><%= comments[j].upvotesCount %></span>
                <% if(currentUser && comments[j].commentAuthor.id == currentUser._id){ %>
                  <span class="dropdown">
                    <button class="btn btn-sm dropdown-toggle editprofile valign" type="button" data-toggle="dropdown"><i class="fas fa-ellipsis-v text-xs"></i></button>
                    <ul class="dropdown-menu dropdown-menu-right dropbox">
                      <div class="container drop-shadow1">
                        <li>
                          <a class="dropitems text-sm" href="/posts/<%=posts[k]._id%>/comments/<%= buckets[i]._id %>/<%=comments[j]._id%>/edit">Edit comment</a>
                        </li>
                        <hr>
                        <li>
                          <li>
                            <button class="dropitems link-button red text-sm" href="#delCommentModalposts<%=posts[k]._id%>comments<%= buckets[i]._id %><%=comments[j]._id%>" data-toggle="modal">Delete comment</button>
                          </li>
                        </li>
                      </div>
                    </ul>
                  </span>
                  <!-- Modal HTML -->
                  <div id="delCommentModalposts<%=posts[k]._id%>comments<%= buckets[i]._id %><%=comments[j]._id%>" class="fixed-padding modal fade">
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
                          <form class="delete-form inline" action="/posts/<%=posts[k]._id%>/comments/<%= buckets[i]._id %>/<%=comments[j]._id%>?_method=DELETE" method="POST">
                            <button class="btn btn-danger btn-sm ml-1" type="submit">Delete</button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                <% } %>
                </div>
              </div>
            <% z++;} %>
            <% } %>
          <% } %>
        </div>
        <hr>
      <% }; %>
      <div class="card-body3">
        <div class="valign">
          <div class="mb-auto">
            <% if(currentUser){ %>
              <a href="/users/<%= currentUser._id %>"><span><img class="postdp rounded-circle" src="<%= CU_50_profilePic || '/images/noUser.png' %>"></span></a>
            <% } else{ %>
              <span><img class="postdp rounded-circle" src="<%= '/images/noUser.png' %>"></span>
            <% }%>
          </div>
          <div class="commentdiv">
            <form action="/posts/<%= posts[k]._id %>/comments" method="POST">
              <div class="input-group">
                <input onclick="block_display('commentbtn<%= posts[k]._id %>');" id="commentbox" class="commentbox text-sm form-control form-control-sm" type="text" name="text" placeholder="Write a comment" required>
              </div>
              <div class="d-flex flex-row-reverse">
                <button class="btn btn-sm btn-success commentbtn commentbtn<%= posts[k]._id %> btnxs ml-2 mt-2">Submit</button>
                <button onclick="none_display('commentbtn<%= posts[k]._id %>'); clear_text();" class="btn btn-secondary commentbtn commentbtn<%= posts[k]._id %> btnxs text-sm mt-2" type="button">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  <% }; %>
  <hr>
<% }; %>
`,{hasVote: response.hasVote, hasModVote: response.hasModVote, posts: response.posts,
  friendsPostUrl: response.friendsPostUrl, currentUser: response.currentUser, CU_50_profilePic: response.CU_50_profilePic,
  PC_50_clubAvatar: response.PC_50_clubAvatar, PA_50_profilePic: response.PA_50_profilePic});
  return html;
}

function club_posts_template(response){
  html = ejs.render(`
<% var len = posts.length; var k=0; for(k;k<len;k++){ %>
  <% if(posts[k].topic == ''){ %>
    <div class="card noborder">
  <% } else{ %>
    <div class="card noborder topic-body">
  <% } %>
    <div class="card-body">
      <div class="dropctn">
        <div class="valign">
          <div>
            <a href="/users/<%= posts[k].postAuthor.id._id %>"><img class="navdp rounded-circle mr-2" src="<%= PA_50_profilePic[k] || '/images/noUser.png' %>"></a>
          </div>
          <div class="lineheight2">
            <div>
              <span class="mobiletext2">
                <a href="/users/<%= posts[k].postAuthor.id._id %>" class="darkgrey"><strong><%= posts[k].postAuthor.id.fullName %></strong></a>
              </span>
              <em class="text-xxs lightgrey">. <%= moment(posts[k].createdAt).calendar();  %></em>
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
                    <form class="post-vote-form valign" action="/posts/<%= posts[k]._id %>/vote" method="POST">
                      <% if(posts[k].moderation != -1){ %>
                        <button id="visibility<%= posts[k]._id %>" class="dropitems link-button moderation text-sm" name="visibility" value="-1" title="Post moderation" type="submit">Visibility(Hide)</button>
                      <% } else if(posts[k].moderation == -1){ %>
                        <button id="visibility<%= posts[k]._id %>" class="dropitems link-button moderation text-sm" name="visibility" value="1" title="Post moderation" type="submit">Visibility(Show)</button>
                      <% } %>
                    </form>
                  </li>
                <% } %>
                <li><a class="dropitems text-sm" href="#">Help ?</a></li>
                <% if(currentUser._id == posts[k].postAuthor.id._id){ %>
                  <hr>
                  <li>
                    <button class="dropitems link-button text-sm red" href="#delPostModalclubs<%= posts[k].postClub %>posts<%= posts[k]._id %>" data-toggle="modal">Delete post</button>
                  </li>
                <% }; %>
              </div>
            </ul>
            <% if(currentUser._id == posts[k].postAuthor.id._id){ %>
              <!-- Modal HTML -->
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
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            <% }; %>
          </div>
        <% }; %>
      </div>
    </div>
    <!-- POSTS WITHOUT TOPIC -->
    <% if(posts[k].topic == ''){ %>
      <% if(posts[k].image){ %>
        <a href="/clubs/<%= posts[k].postClub %>/posts/<%= posts[k]._id %>">
          <div><img class="card-img-top postimg" src="<%= posts[k].image %>"></div>
        </a>
        <div class="card-body">
          <p class="truncate nothing mobiletext linewrap"><%= posts[k].description %></p>
        </div>
        <hr>
      <% } else{ %>
        <div class="nounderline nothing card-body2">
          <a href="/clubs/<%= posts[k].postClub %>/posts/<%= posts[k]._id %>">
            <span class="truncate2 mobiletext linewrap nolink"><%= posts[k].description %></span>
          </a>
        </div>
        <hr>
      <% } %>
      <div class="card-body3">
        <form class="post-vote-form valign" action="/posts/<%= posts[k]._id %>/vote" method="POST">
          <div class="valign">
            <% if(currentUser){ %>
              <% if(hasVote[k] == 1){ %>
                <span class="d-flex mr-1"> 
                  <button id="like-btn<%= posts[k]._id %>" class="vote likebtn" name="like" type="submit" value="like" title="Like"><i class="fas fa-thumbs-up greencolor"></i></button>
                </span>
                <span id="like-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm greencolor"><%= posts[k].likeCount %></span>
                <span class="d-flex ml-2 mr-1">
                  <button id="dislike-btn<%= posts[k]._id %>" class="vote dislikebtn" name="dislike" type="submit" value="dislike" title="Dislike"><i class="far fa-thumbs-down"></i></button>
                </span>
                <span id="dislike-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].dislikeCount %></span>
              <% } else if(hasVote[k] == -1){ %>
                <span class="d-flex mr-1"> 
                  <button id="like-btn<%= posts[k]._id %>" class="vote likebtn" name="like" type="submit" value="like" title="Like"><i class="far fa-thumbs-up"></i></button>
                </span>
                <span id="like-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].likeCount %></span>
                <span class="d-flex ml-2 mr-1">
                  <button id="dislike-btn<%= posts[k]._id %>" class="vote dislikebtn" name="dislike" type="submit" value="dislike" title="Dislike"><i class="fas fa-thumbs-down blackcolor"></i></button>
                </span>
                <span id="dislike-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm blackcolor"><%= posts[k].dislikeCount %></span>
              <% } else if(hasVote[k] == 0 || hasVote[k] == 3){ %>
                <span class="d-flex mr-1"> 
                  <button id="like-btn<%= posts[k]._id %>" class="vote likebtn" name="like" type="submit" value="like" title="Like"><i class="far fa-thumbs-up"></i></button>
                </span>
                <span id="like-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].likeCount %></span>
                <span class="d-flex ml-2 mr-1">
                  <button id="dislike-btn<%= posts[k]._id %>" class="vote dislikebtn" name="dislike" type="submit" value="dislike" title="Dislike"><i class="far fa-thumbs-down"></i></button>
                </span>
                <span id="dislike-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].dislikeCount %></span>
              <% } %>
            <% } else{ %>
              <span class="d-flex mr-1"> 
                <button id="like-btn<%= posts[k]._id %>" class="vote" name="like" type="submit" value="like" title="Like"><i class="fas fa-thumbs-up"></i></button>
              </span>
              <span id="like-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].likeCount %></span>
              <span class="d-flex ml-2 mr-1">
                <button id="dislike-btn<%= posts[k]._id %>" class="vote" name="dislike" type="submit" value="dislike" title="Dislike"><i class="fas fa-thumbs-down"></i></button>
              </span>
              <span id="dislike-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].dislikeCount %></span>
            <% } %>
          </div>
        
          <div class="valign">
            <% if(currentUser){ %>
              <% if(hasVote[k] == 3){ %>
                <span id="heart-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm redcolor"><%= posts[k].heartCount %></span>
                <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart redcolor"></i></button></span>
              <% } else if(hasVote[k] == 0 || hasVote[k] == 1 || hasVote[k] == -1){ %>
                <span id="heart-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].heartCount %></span>
                <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart"></i></button></span>
                <% } %>
                <!-- Moderation -->
                <% if(0 <= posts[k].privacy && posts[k].privacy <= 1){ %>
                  <% if(0 <= rank && rank <= 2 && posts[k].moderation == 1){ %>
                    <span>
                      <button id="moderation<%= posts[k]._id %>" class="moderation btn btnxxs btn-light noshadow text-sm ml-2" name="published" value="0" title="Post moderation" type="submit">Exclusive</button>
                    </span>
                  <% } else if(0 <= rank && rank <= 2 && posts[k].moderation == 0){ %>
                    <span>
                      <button id="moderation<%= posts[k]._id %>" class="moderation btn btnxxs btn-info noshadow text-sm ml-2" name="exclusive" value="1" title="Post moderation" type="submit">Published</button>
                    </span>
                  <% } %>
                <% } %>
                <span class="nodisplay" id="modVisibility<%= posts[k]._id %>"></span>
            <% } else{ %>
              <span id="heart-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].heartCount %></span>
              <span><button id="heart-btn<%= posts[k]._id %>" class="vote" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart"></i></button></span>
            <% } %>
          </div>
        </form>
      </div>
    <% } else{ %>
      <!-- POSTS WITH TOPIC AND FURTHER DISCUSSION -->
      <div class="nounderline nothing">
        <div class="valign topic-head">
          <div class="mx-2 mb-auto">
            <h5 class="nothing topic-h5"><%= posts[k].topic %></h5>
          </div>
          <!-- UP/DOWN VOTE -->
          <div class="mx-2 mb-auto d-flex flex-column">
            <form class="d-flex flex-column post-modvote-form" action="/posts/<%= posts[k]._id %>/modvote" method="POST">
              <% if(hasModVote[k] == 1){%>
                <button id="upVote-btn<%= posts[k]._id %>" class="modvote upVotebtn bluecolor" name="upVote" type="submit" value="up" title="Upvote"><i class="fas fa-caret-up lineheight3"></i></button>
                <span id="modVote-count<%= posts[k]._id %>" class="boldtext nothing text-xs text-center bluecolor"><%= posts[k].upVoteCount - posts[k].downVoteCount %></span>
                <button id="downVote-btn<%= posts[k]._id %>" class="modvote downVotebtn" name="downVote" type="submit" value="down" title="Downvote"><i class="fas fa-caret-down lineheight3"></i></button>
              <% } else if(hasModVote[k] == -1){ %>
                <button id="upVote-btn<%= posts[k]._id %>" class="modvote upVotebtn" name="upVote" type="submit" value="up" title="Upvote"><i class="fas fa-caret-up lineheight3"></i></button>
                <span id="modVote-count<%= posts[k]._id %>" class="boldtext nothing text-xs text-center orangecolor"><%= posts[k].upVoteCount - posts[k].downVoteCount %></span>
                <button id="downVote-btn<%= posts[k]._id %>" class="modvote downVotebtn orangecolor" name="downVote" type="submit" value="down" title="Downvote"><i class="fas fa-caret-down lineheight3"></i></button>
              <% } else if(hasModVote[k] == 0){ %>
                <button id="upVote-btn<%= posts[k]._id %>" class="modvote upVotebtn" name="upVote" type="submit" value="up" title="Upvote"><i class="fas fa-caret-up lineheight3"></i></button>
                <span id="modVote-count<%= posts[k]._id %>" class="boldtext darkgrey nothing text-xs text-center"><%= posts[k].upVoteCount - posts[k].downVoteCount %></span>
                <button id="downVote-btn<%= posts[k]._id %>" class="modvote downVotebtn" name="downVote" type="submit" value="down" title="Downvote"><i class="fas fa-caret-down lineheight3"></i></button>
              <% } %>
            </form>
          </div>
        </div>
        <% if(posts[k].image){ %>
          <div class="truncate nothing mobiletext linewrap card-body3"><%= posts[k].description %></div>
          <a href="/clubs/<%= posts[k].postClub %>/posts/<%= posts[k]._id %>">
            <div><img class="card-img-top postimg" src="<%= posts[k].image %>"></div>
          </a>
        <% } else{ %>
          <a href="/clubs/<%= posts[k].postClub %>/posts/<%= posts[k]._id %>">
            <div class="truncate2 card-body3 mobiletext linewrap nolink"><%= posts[k].description %></div>
          </a>
        <% } %>
      </div>
      <hr>
      <!-- Vote bar -->
      <div class="card-body3">
        <form class="post-vote-form valign" action="/posts/<%= posts[k]._id %>/vote" method="POST">
          <div class="valign">
            <span class="lightgrey text-sm"><strong><%= posts[k].subpostsCount %></strong> subPosts</span>
          </div>
          <div class="valign">
            <% if(currentUser){ %>
              <% if(hasVote[k] == 3){ %>
                <span id="heart-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm redcolor"><%= posts[k].heartCount %></span>
                <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart redcolor"></i></button></span>
              <% } else if(hasVote[k] == 0 || hasVote[k] == 1 || hasVote[k] == -1){ %>
                <span id="heart-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].heartCount %></span>
                <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart"></i></button></span>
                <% } %>
                  <span class="nodisplay" id="modVisibility<%= posts[k]._id %>"></span>
            <% } else{ %>
              <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart"></i></button></span>
            <% } %>
          </div>
        </form>
      </div>
    <% } %>
  </div>
  <!-- COMMENTS -->
  <% if(posts[k].topic == ''){ %>
    <div class="card noborder indexcard2">
      <% if(posts[k].commentsCount != 0){ %>
        <div class="card-body3">
          <% var z=1; var buckets = posts[k].commentBuckets; var len1 = buckets.length; var i; for(i=len1-1;i>=0;i--){%>
            <% var comments = buckets[i].comments; var len2 = comments.length; var j; for(j=len2-1;j>=0;j--){%>
            <% if(z<=2){ %>
              <div class="valign">
                <div class="wordwrap">
                  <span><a href="/users/<%= comments[j].commentAuthor.id %>" class="black"><span class="nothing mobiletext boldtext"><%= comments[j].commentAuthor.authorName %></span></a>
                  </span>
                  <span class="mobiletext"><%= comments[j].text %></span>
                </div>
                <div class="d-flex flex-row-reverse valign mb-auto pt-2">
                  <span class="text-xs text-center boldtext lightgrey"><%= comments[j].upvotesCount %></span>
                <% if(currentUser && comments[j].commentAuthor.id == currentUser._id){ %>
                  <span class="dropdown">
                    <button class="btn btn-sm dropdown-toggle valign" type="button" data-toggle="dropdown"><i class="fas fa-ellipsis-v text-xxs"></i></button>
                    <ul class="dropdown-menu dropdown-menu-right dropbox">
                      <div class="container drop-shadow1">
                        <li>
                          <a class="dropitems text-sm" href="/posts/<%=posts[k]._id%>/comments/<%= buckets[i]._id %>/<%=comments[j]._id%>/edit">Edit comment</a>
                        </li>
                        <hr>
                        <li>
                          <button class="dropitems link-button red text-sm" href="#delCommentModalposts<%=posts[k]._id%>comments<%= buckets[i]._id %><%=comments[j]._id%>" data-toggle="modal">Delete comment</button>
                        </li>
                      </div>
                    </ul>
                  </span>
                  <!-- Modal HTML -->
                  <div id="delCommentModalposts<%=posts[k]._id%>comments<%= buckets[i]._id %><%=comments[j]._id%>" class="fixed-padding modal fade">
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
                          <form class="delete-form inline text-sm" action="/posts/<%=posts[k]._id%>/comments/<%= buckets[i]._id %>/<%=comments[j]._id%>?_method=DELETE" method="POST">
                            <button class="btn btn-danger btn-sm ml-1" type="submit">Delete</button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                <% } %>
                </div>
              </div>
            <% z++;} %>
            <% } %>
          <% } %>
        </div>
        <hr>
      <% }; %>
      <div class="card-body3">
        <div class="valign">
          <div class="mb-auto">
            <% if(currentUser){ %>
              <a href="/users/<%= currentUser._id %>"><span><img class="postdp rounded-circle" src="<%= CU_50_profilePic || '/images/noUser.png' %>"></span></a>
            <% } else{ %>
              <span><img class="postdp rounded-circle" src="<%= '/images/noUser.png' %>"></span>
            <% }%>
          </div>
          <div class="commentdiv">
            <form action="/posts/<%= posts[k]._id %>/comments" method="POST">
              <div class="input-group">
                <input onclick="block_display('commentbtn<%= posts[k]._id %>');" id="commentbox" class="commentbox text-sm form-control form-control-sm" type="text" name="text" placeholder="Write a comment" required>
              </div>
              <div class="d-flex flex-row-reverse">
                <button class="btn btn-sm btn-success commentbtn commentbtn<%= posts[k]._id %> btnxs ml-2 mt-2">Submit</button>
                <button onclick="none_display('commentbtn<%= posts[k]._id %>'); clear_text();" class="btn  btn-secondary commentbtn commentbtn<%= posts[k]._id %> btnxs text-sm mt-2" type="button">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  <% }; %>
  <hr>
<% }; %>

<%
function privacyText(privacy){
  if(privacy == 0){return 'Public';}
  else if(privacy == 1){return 'Friends';}
  else if(privacy == 2){return 'Club';}
  else if(privacy == 3){return 'Club(friends)';}
  else if(privacy == 4){return 'Private';}
} %>
`,{hasVote: response.hasVote, hasModVote: response.hasModVote, posts: response.posts, rank: response.rank,
  currentUser: response.currentUser, PA_50_profilePic: response.PA_50_profilePic, CU_50_profilePic: response.CU_50_profilePic});
  return html;
}

function user_posts_template(response){
  html = ejs.render(`
<% var len = posts.length; var k=0; for(k;k<len;k++){ %>
  <% if(posts[k].topic == ''){ %>
    <div class="card noborder">
  <% } else{ %>
    <div class="card noborder topic-body">
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
              <em class="text-xxs lightgrey">. <%= moment(posts[k].createdAt).calendar(); %></em>
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
                <% }; %>
              </div>
            </ul>
            <% if(currentUser._id == posts[k].postAuthor.id){ %>
              <!-- Modal HTML -->
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
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            <% }; %>
          </div>
        <% }; %>
      </div>
    </div>
    <% if(posts[k].topic == ''){ %>
      <% if(posts[k].image){ %>
        <a href="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>">
          <div><img class="card-img-top postimg" src="<%= posts[k].image %>"></div>
        </a>
        <div class="card-body">
          <p class="truncate nothing mobiletext linewrap"><%= posts[k].description %></p>
        </div>
        <hr>
      <% } else{ %>
        <div class="card-body2 nounderline nothing">
          <a href="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>">
            <p class="truncate2 nothing mobiletext linewrap nolink"><%= posts[k].description %></p>
          </a>
        </div>
        <hr>
      <% } %>
      <div class="card-body3">
        <form class="post-vote-form valign" action="/posts/<%= posts[k]._id %>/vote" method="POST">
          <div class="valign">
            <% if(currentUser){ %>
              <% if(hasVote[k] == 1){ %>
                <span class="d-flex mr-1"> 
                  <button id="like-btn<%= posts[k]._id %>" class="vote likebtn" name="like" type="submit" value="like" title="Like"><i class="fas fa-thumbs-up greencolor"></i></button>
                </span>
                <span id="like-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm greencolor"><%= posts[k].likeCount %></span>
                <span class="d-flex ml-2 mr-1">
                  <button id="dislike-btn<%= posts[k]._id %>" class="vote dislikebtn" name="dislike" type="submit" value="dislike" title="Dislike"><i class="far fa-thumbs-down"></i></button>
                </span>
                <span id="dislike-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].dislikeCount %></span>
              <% } else if(hasVote[k] == -1){ %>
                <span class="d-flex mr-1"> 
                  <button id="like-btn<%= posts[k]._id %>" class="vote likebtn" name="like" type="submit" value="like" title="Like"><i class="far fa-thumbs-up"></i></button>
                </span>
                <span id="like-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].likeCount %></span>
                <span class="d-flex ml-2 mr-1">
                  <button id="dislike-btn<%= posts[k]._id %>" class="vote dislikebtn" name="dislike" type="submit" value="dislike" title="Dislike"><i class="fas fa-thumbs-down blackcolor"></i></button>
                </span>
                <span id="dislike-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm blackcolor"><%= posts[k].dislikeCount %></span>
              <% } else if(hasVote[k] == 0 || hasVote[k] == 3){ %>
                <span class="d-flex mr-1"> 
                  <button id="like-btn<%= posts[k]._id %>" class="vote likebtn" name="like" type="submit" value="like" title="Like"><i class="far fa-thumbs-up"></i></button>
                </span>
                <span id="like-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].likeCount %></span>
                <span class="d-flex ml-2 mr-1">
                  <button id="dislike-btn<%= posts[k]._id %>" class="vote dislikebtn" name="dislike" type="submit" value="dislike" title="Dislike"><i class="far fa-thumbs-down"></i></button>
                </span>
                <span id="dislike-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].dislikeCount %></span>
              <% } %>
            <% } else{ %>
              <span class="d-flex mr-1"> 
                <button id="like-btn<%= posts[k]._id %>" class="vote" name="like" type="submit" value="like" title="Like"><i class="fas fa-thumbs-up"></i></button>
              </span>
              <span id="like-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].likeCount %></span>
              <span class="d-flex ml-2 mr-1">
                <button id="dislike-btn<%= posts[k]._id %>" class="vote" name="dislike" type="submit" value="dislike" title="Dislike"><i class="fas fa-thumbs-down"></i></button>
              </span>
              <span id="dislike-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].dislikeCount %></span>
            <% } %>
          </div>
        
          <div class="valign">
            <% if(currentUser){ %>
              <% if(hasVote[k] == 3){ %>
                <span id="heart-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm redcolor"><%= posts[k].heartCount %></span>
                <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart redcolor"></i></button></span>
              <% } else if(hasVote[k] == 0 || hasVote[k] == 1 || hasVote[k] == -1){ %>
                <span id="heart-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].heartCount %></span>
                <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart"></i></button></span>
                <% } %>
            <% } else{ %>
              <span id="heart-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].heartCount %></span>
              <span><button id="heart-btn<%= posts[k]._id %>" class="vote" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart"></i></button></span>
            <% } %>
          </div>
        </form>
      </div>
    <% } else{ %>
      <!-- POSTS WITH TOPIC AND FURTHER DISCUSSION -->
      <div class="nounderline nothing">
        <div class="valign topic-head">
          <div class="mx-2 mb-auto">
            <h5 class="nothing topic-h5"><%= posts[k].topic %></h5>
          </div>
          <!-- UP/DOWN VOTE -->
          <div class="mx-2 mb-auto d-flex flex-column">
            <form class="d-flex flex-column post-modvote-form" action="/posts/<%= posts[k]._id %>/modvote" method="POST">
              <% if(hasModVote[k] == 1){%>
                <button id="upVote-btn<%= posts[k]._id %>" class="modvote upVotebtn bluecolor" name="upVote" type="submit" value="up" title="Upvote"><i class="fas fa-caret-up lineheight3"></i></button>
                <span id="modVote-count<%= posts[k]._id %>" class="boldtext nothing text-xs text-center bluecolor"><%= posts[k].upVoteCount - posts[k].downVoteCount %></span>
                <button id="downVote-btn<%= posts[k]._id %>" class="modvote downVotebtn" name="downVote" type="submit" value="down" title="Downvote"><i class="fas fa-caret-down lineheight3"></i></button>
              <% } else if(hasModVote[k] == -1){ %>
                <button id="upVote-btn<%= posts[k]._id %>" class="modvote upVotebtn" name="upVote" type="submit" value="up" title="Upvote"><i class="fas fa-caret-up lineheight3"></i></button>
                <span id="modVote-count<%= posts[k]._id %>" class="boldtext nothing text-xs text-center orangecolor"><%= posts[k].upVoteCount - posts[k].downVoteCount %></span>
                <button id="downVote-btn<%= posts[k]._id %>" class="modvote downVotebtn orangecolor" name="downVote" type="submit" value="down" title="Downvote"><i class="fas fa-caret-down lineheight3"></i></button>
              <% } else if(hasModVote[k] == 0){ %>
                <button id="upVote-btn<%= posts[k]._id %>" class="modvote upVotebtn" name="upVote" type="submit" value="up" title="Upvote"><i class="fas fa-caret-up lineheight3"></i></button>
                <span id="modVote-count<%= posts[k]._id %>" class="boldtext darkgrey nothing text-xs text-center"><%= posts[k].upVoteCount - posts[k].downVoteCount %></span>
                <button id="downVote-btn<%= posts[k]._id %>" class="modvote downVotebtn" name="downVote" type="submit" value="down" title="Downvote"><i class="fas fa-caret-down lineheight3"></i></button>
              <% } %>
            </form>
          </div>
        </div>
        <% if(posts[k].image){ %>
          <div class="truncate nothing mobiletext linewrap card-body3"><%= posts[k].description %></div>
          <a href="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>">
            <div><img class="card-img-top postimg" src="<%= posts[k].image %>"></div>
          </a>
        <% } else{ %>
          <a href="/clubs/<%= posts[k].postClub._id %>/posts/<%= posts[k]._id %>">
            <div class="truncate2 card-body3 mobiletext linewrap nolink"><%= posts[k].description %></div>
          </a>
        <% } %>
      </div>
      <hr>
      <!-- Vote bar -->
      <div class="card-body3">
        <form class="post-vote-form valign" action="/posts/<%= posts[k]._id %>/vote" method="POST">
          <div class="valign">
            <span class="lightgrey text-sm"><strong><%= posts[k].subpostsCount %></strong> subPosts</span>
          </div>
          <div class="valign">
            <% if(currentUser){ %>
              <% if(hasVote[k] == 3){ %>
                <span id="heart-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm redcolor"><%= posts[k].heartCount %></span>
                <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="fas fa-heart redcolor"></i></button></span>
              <% } else if(hasVote[k] == 0 || hasVote[k] == 1 || hasVote[k] == -1){ %>
                <span id="heart-count<%= posts[k]._id %>" class="boldtext lightgrey nothing text-sm"><%= posts[k].heartCount %></span>
                <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart"></i></button></span>
                <% } %>
                  <span class="nodisplay" id="modVisibility<%= posts[k]._id %>"></span>
            <% } else{ %>
              <span><button id="heart-btn<%= posts[k]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart" title="Heart"><i class="far fa-heart"></i></button></span>
            <% } %>
          </div>
        </form>
      </div>
    <% } %>
  </div>
  <!-- COMMENTS -->
  <% if(posts[k].topic == ''){ %>
    <div class="card noborder indexcard2">
      <% if(posts[k].commentsCount != 0){ %>
        <div class="card-body3">
          <% var z=1; var buckets = posts[k].commentBuckets; var len1 = buckets.length; var i; for(i=len1-1;i>=0;i--){%>
            <% var comments = buckets[i].comments; var len2 = comments.length; var j; for(j=len2-1;j>=0;j--){%>
            <% if(z<=2){ %>
              <div class="valign">
                <div class="wordwrap">
                  <span><a href="/users/<%= comments[j].commentAuthor.id %>" class="black"><span class="nothing mobiletext boldtext"><%= comments[j].commentAuthor.authorName %></span></a>
                  </span>
                  <span class="mobiletext"><%= comments[j].text %></span>
                </div>
                <div class="d-flex flex-row-reverse valign mb-auto pt-2">
                  <span class="text-xs text-center boldtext lightgrey"><%= comments[j].upvotesCount %></span>
                <% if(currentUser && comments[j].commentAuthor.id == currentUser._id){ %>
                  <span class="dropdown nopad">
                    <button class="btn btn-sm dropdown-toggle valign" type="button" data-toggle="dropdown"><i class="fas fa-ellipsis-v text-xxs ellipsis-sm"></i></button>
                    <ul class="dropdown-menu dropdown-menu-right dropbox">
                      <div class="container drop-shadow1">
                        <li>
                          <a class="dropitems text-sm" href="/posts/<%=posts[k]._id%>/comments/<%= buckets[i]._id %>/<%=comments[j]._id%>/edit">Edit comment</a>
                        </li>
                        <hr>
                        <li>
                          <button class="dropitems link-button red text-sm" href="#delCommentModalposts<%=posts[k]._id%>comments<%= buckets[i]._id %><%=comments[j]._id%>" data-toggle="modal">Delete comment</button>
                        </li>
                      </div>
                    </ul>
                  </span>
                  <!-- Modal HTML -->
                  <div id="delCommentModalposts<%=posts[k]._id%>comments<%= buckets[i]._id %><%=comments[j]._id%>" class="fixed-padding modal fade">
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
                          <form class="delete-form inline" action="/posts/<%=posts[k]._id%>/comments/<%= buckets[i]._id %>/<%=comments[j]._id%>?_method=DELETE" method="POST">
                            <button class="btn btn-danger btn-sm ml-1" type="submit">Delete</button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                <% } %>
                </div>
              </div>
            <% z++;} %>
            <% } %>
          <% } %>
        </div>
        <hr>
      <% }; %>
      <div class="card-body3">
        <div class="valign">
          <div class="mb-auto">
            <% if(currentUser){ %>
              <a href="/users/<%= currentUser._id %>"><span><img class="postdp rounded-circle" src="<%= CU_50_profilePic || '/images/noUser.png' %>"></span></a>
            <% }else{ %>
              <span><img class="postdp rounded-circle" src="<%= '/images/noUser.png' %>"></span>
            <% }%>
          </div>
          <div class="commentdiv">
            <form action="/posts/<%= posts[k]._id %>/comments" method="POST">
              <div class="input-group">
                <input onclick="block_display('commentbtn<%= posts[k]._id %>');" id="commentbox" class="commentbox text-sm form-control form-control-sm" type="text" name="text" placeholder="Write a comment" required>
              </div>
              <div class="d-flex flex-row-reverse">
                <button class="btn btn-sm btn-success commentbtn commentbtn<%= posts[k]._id %> btnxs ml-2 mt-2">Submit</button>
                <button onclick="none_display('commentbtn<%= posts[k]._id %>'); clear_text();" class="btn btn-secondary commentbtn commentbtn<%= posts[k]._id %> btnxs text-sm mt-2" type="button">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  <% }; %>
  <hr>
<% }; %>
`,{hasVote: response.hasVote, hasModVote: response.hasModVote, posts: response.posts, match: response.match,
  currentUser: response.currentUser, PC_50_clubAvatar: response.PC_50_clubAvatar, CU_50_profilePic: response.CU_50_profilePic});
  return html;
}

function heart_posts_template(response){
  html = ejs.render(`
<% var len = postsH.length; var l=0; for(l;l<len;l++){ %>
  <% if(postsH[l].topic == ''){ %>
    <div class="card noborder">
  <% } else{ %>
    <div class="card noborder topic-body">
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
              <em class="text-xxs lightgrey">. <%= moment(postsH[l].createdAt).fromNow() %></em>
            </div>
            <div>
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
                    <button class="dropitems link-button text-sm red" href="#delPostHModalclubs<%= postsH[l].postClub._id %>posts<%= postsH[l]._id %>" data-toggle="modal">Delete post</button>
                  </li>
                <% }; %>
              </div>
            </ul>
            <% if(currentUser._id == postsH[l].postAuthor.id){ %>
              <!-- Modal HTML -->
              <div id="delPostHModalclubs<%= postsH[l].postClub._id %>posts<%= postsH[l]._id %>" class="fixed-padding modal fade">
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
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            <% }; %>
          </div>
        <% }; %>
      </div>
    </div>
    <% if(postsH[l].topic == ''){ %>
      <% if(postsH[l].image){ %>
        <a href="/clubs/<%= postsH[l].postClub._id %>/posts/<%= postsH[l]._id %>">
          <div><img class="card-img-top postimg" src="<%= postsH[l].image %>"></div>
        </a>
        <div class="card-body">
          <p class="truncate nothing mobiletext linewrap"><%= postsH[l].description %></p>
        </div>
        <hr>
      <% } else{ %>
        <div class="card-body2 nounderline nothing">
          <a href="/clubs/<%= postsH[l].postClub._id %>/posts/<%= postsH[l]._id %>">
            <p class="truncate2 nothing mobiletext linewrap nolink"><%= postsH[l].description %></p>
          </a>
        </div>
        <hr>
      <% } %>
      <div class="card-body3">
        <form class="post-vote-form-heart valign" action="/posts/<%= postsH[l]._id %>/vote" method="POST">
          <div class="valign">
            <% if(currentUser){ %>
              <% if(hasVoteH[l] == 1){ %>
                <span class="d-flex mr-1"> 
                  <button id="like-btnH<%= postsH[l]._id %>" class="vote likebtn" name="like" type="submit" value="like"><i class="fas fa-thumbs-up greencolor"></i></button>
                </span>
                <span id="like-countH<%= postsH[l]._id %>" class="boldtext lightgrey nothing text-sm greencolor"><%= postsH[l].likeCount %></span>
                <span class="d-flex ml-2 mr-1">
                  <button id="dislike-btnH<%= postsH[l]._id %>" class="vote dislikebtn" name="dislike" type="submit" value="dislike"><i class="far fa-thumbs-down"></i></button>
                </span>
                <span id="dislike-countH<%= postsH[l]._id %>" class="boldtext lightgrey nothing text-sm"><%= postsH[l].dislikeCount %></span>
              <% } else if(hasVoteH[l] == -1){ %>
                <span class="d-flex mr-1"> 
                  <button id="like-btnH<%= postsH[l]._id %>" class="vote likebtn" name="like" type="submit" value="like"><i class="far fa-thumbs-up"></i></button>
                </span>
                <span id="like-countH<%= postsH[l]._id %>" class="boldtext lightgrey nothing text-sm"><%= postsH[l].likeCount %></span>
                <span class="d-flex ml-2 mr-1">
                  <button id="dislike-btnH<%= postsH[l]._id %>" class="vote dislikebtn" name="dislike" type="submit" value="dislike"><i class="fas fa-thumbs-down blackcolor"></i></button>
                </span>
                <span id="dislike-countH<%= postsH[l]._id %>" class="boldtext lightgrey nothing text-sm blackcolor"><%= postsH[l].dislikeCount %></span>
              <% } else if(hasVoteH[l] == 0 || hasVoteH[l] == 3){ %>
                <span class="d-flex mr-1"> 
                  <button id="like-btnH<%= postsH[l]._id %>" class="vote likebtn" name="like" type="submit" value="like"><i class="far fa-thumbs-up"></i></button>
                </span>
                <span id="like-countH<%= postsH[l]._id %>" class="boldtext lightgrey nothing text-sm"><%= postsH[l].likeCount %></span>
                <span class="d-flex ml-2 mr-1">
                  <button id="dislike-btnH<%= postsH[l]._id %>" class="vote dislikebtn" name="dislike" type="submit" value="dislike"><i class="far fa-thumbs-down"></i></button>
                </span>
                <span id="dislike-countH<%= postsH[l]._id %>" class="boldtext lightgrey nothing text-sm"><%= postsH[l].dislikeCount %></span>
              <% } %>
            <% } else{ %>
              <span class="d-flex mr-1"> 
                <button id="like-btnH<%= postsH[l]._id %>" class="vote" name="like" type="submit" value="like"><i class="fas fa-thumbs-up"></i></button>
              </span>
              <span id="like-countH<%= postsH[l]._id %>" class="boldtext lightgrey nothing text-sm"><%= postsH[l].likeCount %></span>
              <span class="d-flex ml-2 mr-1">
                <button id="dislike-btnH<%= postsH[l]._id %>" class="vote" name="dislike" type="submit" value="dislike"><i class="fas fa-thumbs-down"></i></button>
              </span>
              <span id="dislike-countH<%= postsH[l]._id %>" class="boldtext lightgrey nothing text-sm"><%= postsH[l].dislikeCount %></span>
            <% } %>
          </div>
        
          <div class="valign">
            <% if(currentUser){ %>
              <% if(hasVoteH[l] == 3){ %>
                <span id="heart-countH<%= postsH[l]._id %>" class="boldtext lightgrey nothing text-sm redcolor"><%= postsH[l].heartCount %></span>
                <span><button id="heart-btnH<%= postsH[l]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart"><i class="fas fa-heart redcolor"></i></button></span>
              <% } else if(hasVoteH[l] == 0 || hasVoteH[l] == 1 || hasVoteH[l] == -1){ %>
                <span id="heart-countH<%= postsH[l]._id %>" class="boldtext lightgrey nothing text-sm"><%= postsH[l].heartCount %></span>
                <span><button id="heart-btnH<%= postsH[l]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart"><i class="far fa-heart"></i></button></span>
                <% } %>
            <% } else{ %>
              <span id="heart-countH<%= postsH[l]._id %>" class="boldtext lightgrey nothing text-sm"><%= postsH[l].heartCount %></span>
              <span><button id="heart-btnH<%= postsH[l]._id %>" class="vote" name="heart" type="submit" value="heart"><i class="fas fa-heart"></i></button></span>
            <% } %>
          </div>
        </form>
      </div>
    <% } else{ %>
      <!-- POSTS WITH TOPIC AND FURTHER DISCUSSION -->
      <div class="nounderline nothing">
        <div class="valign topic-head">
          <div class="mx-2 mb-auto">
            <h5 class="nothing topic-h5"><%= postsH[l].topic %></h5>
          </div>
          <!-- UP/DOWN VOTE -->
          <div class="mx-2 mb-auto d-flex flex-column">
            <form class="d-flex flex-column post-modvote-form-heart" action="/posts/<%= postsH[l]._id %>/modvote" method="POST">
              <% if(hasModVoteH[l] == 1){%>
                <button id="upVote-btnH<%= postsH[l]._id %>" class="modvote upVotebtn bluecolor" name="upVote" type="submit" value="up"><i class="fas fa-caret-up lineheight3"></i></button>
                <span id="modVote-countH<%= postsH[l]._id %>" class="boldtext nothing text-xs text-center bluecolor"><%= postsH[l].upVoteCount - postsH[l].downVoteCount %></span>
                <button id="downVote-btnH<%= postsH[l]._id %>" class="modvote downVotebtn" name="downVote" type="submit" value="down"><i class="fas fa-caret-down lineheight3"></i></button>
              <% } else if(hasModVoteH[l] == -1){ %>
                <button id="upVote-btnH<%= postsH[l]._id %>" class="modvote upVotebtn" name="upVote" type="submit" value="up"><i class="fas fa-caret-up lineheight3"></i></button>
                <span id="modVote-countH<%= postsH[l]._id %>" class="boldtext nothing text-xs text-center orangecolor"><%= postsH[l].upVoteCount - postsH[l].downVoteCount %></span>
                <button id="downVote-btnH<%= postsH[l]._id %>" class="modvote downVotebtn orangecolor" name="downVote" type="submit" value="down"><i class="fas fa-caret-down lineheight3"></i></button>
              <% } else if(hasModVoteH[l] == 0){ %>
                <button id="upVote-btnH<%= postsH[l]._id %>" class="modvote upVotebtn" name="upVote" type="submit" value="up"><i class="fas fa-caret-up lineheight3"></i></button>
                <span id="modVote-countH<%= postsH[l]._id %>" class="boldtext darkgrey nothing text-xs text-center"><%= postsH[l].upVoteCount - postsH[l].downVoteCount %></span>
                <button id="downVote-btnH<%= postsH[l]._id %>" class="modvote downVotebtn" name="downVote" type="submit" value="down"><i class="fas fa-caret-down lineheight3"></i></button>
              <% } %>
            </form>
          </div>
        </div>
        <% if(postsH[l].image){ %>
          <div class="truncate nothing mobiletext linewrap card-body3"><%= postsH[l].description %></div>
          <a href="/clubs/<%= postsH[l].postClub._id %>/posts/<%= postsH[l]._id %>">
            <div><img class="card-img-top postimg" src="<%= postsH[l].image %>"></div>
          </a>
        <% } else{ %>
          <a href="/clubs/<%= postsH[l].postClub._id %>/posts/<%= postsH[l]._id %>">
            <div class="truncate2 card-body3 mobiletext linewrap nolink"><%= postsH[l].description %></div>
          </a>
        <% } %>
      </div>
      <hr>
      <!-- Vote bar -->
      <div class="card-body3">
        <form class="post-vote-form-heart valign" action="/posts/<%= postsH[l]._id %>/vote" method="POST">
          <div class="valign">
            <span class="lightgrey text-sm"><strong><%= postsH[l].subpostsCount %></strong> subPosts</span>
          </div>
          <div class="valign">
            <% if(currentUser){ %>
              <% if(hasVoteH[l] == 3){ %>
                <span id="heart-countH<%= postsH[l]._id %>" class="boldtext lightgrey nothing text-sm redcolor"><%= postsH[l].heartCount %></span>
                <span><button id="heart-btnH<%= postsH[l]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart"><i class="fas fa-heart redcolor"></i></button></span>
              <% } else if(hasVoteH[l] == 0 || hasVoteH[l] == 1 || hasVoteH[l] == -1){ %>
                <span id="heart-countH<%= postsH[l]._id %>" class="boldtext lightgrey nothing text-sm"><%= postsH[l].heartCount %></span>
                <span><button id="heart-btnH<%= postsH[l]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart"><i class="far fa-heart"></i></button></span>
                <% } %>
                  <span class="nodisplay" id="modVisibility<%= postsH[l]._id %>"></span>
            <% } else{ %>
              <span><button id="heart-btnH<%= postsH[l]._id %>" class="vote heartbtn" name="heart" type="submit" value="heart"><i class="far fa-heart"></i></button></span>
            <% } %>
          </div>
        </form>
      </div>
    <% } %>
  </div>
  <!-- COMMENTS -->
  <% if(postsH[l].topic == ''){ %>
    <div class="card noborder indexcard2">
      <% if(postsH[l].commentsCount != 0){ %>
        <div class="card-body3">
          <% var z=1; var buckets = postsH[l].commentBuckets; var len1 = buckets.length; var i; for(i=len1-1;i>=0;i--){ %>
            <% var comments = buckets[i].comments; var len2 = comments.length; var j; for(j=len2-1;j>=0;j--){ %>
            <% if(z<=2){ %>
              <div class="valign">
                <div class="wordwrap">
                  <span><a href="/users/<%= comments[j].commentAuthor.id %>" class="black"><span class="nothing mobiletext boldtext"><%= comments[j].commentAuthor.authorName %></span></a>
                  </span>
                  <span class="mobiletext"><%= comments[j].text %></span>
                </div>
                <div class="d-flex flex-row-reverse valign mb-auto pt-2">
                  <span class="text-xs text-center boldtext lightgrey"><%= comments[j].upvotesCount %></span>
                <% if(currentUser && comments[j].commentAuthor.id == currentUser._id){ %>
                  <span class="dropdown nopad">
                    <button class="btn btn-sm dropdown-toggle valign" type="button" data-toggle="dropdown"><i class="fas fa-ellipsis-v text-xxs ellipsis-sm"></i></button>
                    <ul class="dropdown-menu dropdown-menu-right dropbox">
                      <div class="container drop-shadow1">
                        <li>
                          <a class="dropitems text-sm" href="/posts/<%=postsH[l]._id%>/comments/<%= buckets[i]._id %>/<%=comments[j]._id%>/edit">Edit comment</a>
                        </li>
                        <hr>
                        <li>
                          <button class="dropitems link-button red text-sm" href="#delCommentModalposts<%=postsH[l]._id%>comments<%= buckets[i]._id %><%=comments[j]._id%>" data-toggle="modal">Delete comment</button>
                        </li>
                      </div>
                    </ul>
                  </span>
                  <!-- Modal HTML -->
                  <div id="delCommentModalposts<%=postsH[l]._id%>comments<%= buckets[i]._id %><%=comments[j]._id%>" class="fixed-padding modal fade">
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
                          <form class="delete-form inline" action="/posts/<%=postsH[l]._id%>/comments/<%= buckets[i]._id %>/<%=comments[j]._id%>?_method=DELETE" method="POST">
                            <button class="btn btn-danger btn-sm ml-1" type="submit">Delete</button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                <% } %>
                </div>
              </div>
            <% z++;} %>
            <% } %>
          <% } %>
        </div>
        <hr>
      <% }; %>
      <div class="card-body3">
        <div class="valign">
          <div class="mb-auto">
            <% if(currentUser){ %>
              <a href="/users/<%= currentUser._id %>"><span><img class="postdp rounded-circle" src="<%= CU_50_profilePicH || '/images/noUser.png' %>"></span></a>
            <% }else{ %>
              <span><img class="postdp rounded-circle" src="<%= '/images/noUser.png' %>"></span>
            <% }%>
          </div>
          <div class="commentdiv">
            <form action="/posts/<%= postsH[l]._id %>/comments" method="POST">
              <div class="input-group">
                <input onclick="block_display('commentbtn<%= postsH[l]._id %>');" id="commentbox" class="commentbox text-sm form-control form-control-sm" type="text" name="text" placeholder="Write a comment" required>
              </div>
              <div class="d-flex flex-row-reverse">
                <button class="btn btn-sm btn-success commentbtn commentbtn<%= postsH[l]._id %> btnxs ml-2 mt-2">Submit</button>
                <button onclick="none_display('commentbtn<%= postsH[l]._id %>'); clear_text();" class="btn btn-secondary commentbtn commentbtn<%= postsH[l]._id %> btnxs text-sm mt-2" type="button">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  <% }; %>
  <hr>
<% }; %>
`,{hasVoteH: response.hasVote, hasModVoteH: response.hasModVote, postsH: response.posts, match: response.match,
  currentUser: response.currentUser, PC_50_clubAvatarH: response.PC_50_clubAvatarH, CU_50_profilePicH: response.CU_50_profilePicH});
  return html;
}

function post_comments_template(response){
  html = ejs.render(`
<% var comments = buckets[0].comments; var len2 = comments.length; var j; for(j=len2-1;j>=0;j--){ %>
  <div class="mb-1">
    <div class="valign card-body1">
      <div class="mb-auto py-2 commentpad">
        <a href="/users/<%= comments[j].commentAuthor.id._id %>">
          <img class="postdp rounded-circle" src="<%= CA_50_profilePic[j] || '/images/noUser.png' %>">
        </a>
      </div>
      <div class="commentdiv my-1 pb-2 lineheight hr2">
        <div class="valign commentpad commentpad2">
          <div>
            <span><a href="/users/<%= comments[j].commentAuthor.id._id %>" class="text-sm darkgrey"><strong><span><%= comments[j].commentAuthor.id.fullName %></span></strong></a>
            </span>
            <span class="darkgrey text-xxs mobilebold"><%= moment(comments[j].postedAt).fromNow() %></span>
          </div>
          <div class="d-flex flex-row mb-auto">
            <% if(currentUser && comments[j].commentAuthor.id._id == currentUser){ %>
              <div class="dropdown">
                <button class="btn btn-sm dropdown-toggle editprofile nothing px-1 pt-1" type="button" data-toggle="dropdown"><i class="fas fa-ellipsis-v text-xxs"></i></button>
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
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            <% } %>
            <form action="/comments/<%= buckets[0]._id %>/<%= comments[j]._id %>/vote" method="POST">
              <div class="commentwrap lineheight0 mt-1">
                <% if(upComments.includes(comments[j]._id)){ %>
                  <button id="comment-up-btn<%= comments[j]._id %>" class="vote likebtn greencolor commentvote valign" name="commentUp" type="button" value="up" title="Upvote comment">
                    <div>
                      <i class="fas fa-arrow-alt-circle-up"></i>
                    </div>
                    <div id="comment-up-count<%= comments[j]._id %>" class="vote boldtext text-xs greencolor ml-1" name="commentUp" type="button" value="up" title="Upvote comment">
                      <%= comments[j].upvotesCount %>
                  </div>
                  </button>
                <% } else{ %>
                  <button id="comment-up-btn<%= comments[j]._id %>" class="vote likebtn commentvote valign" name="commentUp" type="button" value="up" title="Upvote comment">
                    <div>
                      <i class="fas fa-arrow-alt-circle-up"></i>
                    </div>
                    <div id="comment-up-count<%= comments[j]._id %>" class="vote boldtext text-xs lightgrey ml-1" name="commentUp" type="button" value="up" title="Upvote comment">
                      <%= comments[j].upvotesCount %>
                    </div>
                  </button>
                <% } %>
              </div>
            </form>
          </div>
        </div>
        <div class="mobiletext linewrap commentpad commentpad2 pr-1 pb-1" style="margin-top: -0.25rem ;"><%= comments[j].text %></div>
      </div>
    </div>
  </div>
<% } %>
`,{post: response.post, upComments: response.upComments, buckets: response.buckets, index: response.index,
  currentUser: response.currentUser, CA_50_profilePic: response.CA_50_profilePic});
  return html;
}

function post_subPosts_template(response){
  html = ejs.render(` 
<% if(post.subpostBuckets.length >= 1){ %>
  <div class="dropctn mt-2">
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
                <button id="page-index-button" class="btn btn-secondary text-sm btnxs" type="submit"> Go </button>
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
              <img class="subpostdp my-1" src="<%= sPA_50_profilePic[j] || '/images/noUser.png' %>">
            </a>
          </div>
          <div><span class="text-xs">#</span><span class="boldtext blackcolor nopad"><%= (j+1)+(20)*(bucket[0].bucket-1) %></span></div>
          <hr>
          <div class="d-flex flex-row mx-auto">
            <% if(0 <= rank && rank <= 4){ %>
              <form action="/subposts/<%= bucket[0]._id %>/<%= subPosts[j]._id %>/vote" method="POST">
                <% if(subVotes.subLikes.includes(subPosts[j]._id)){ %>
                  <span> 
                    <button id="like-btn<%= subPosts[j]._id %>" class="vote2 likebtn" name="subLike" type="submit" value="like" title="Agree"><i class="fas fa-thumbs-up greencolor"></i></button>
                  </span>
                  <span id="like-count<%= subPosts[j]._id %>" class="boldtext lightgrey nothing text-xxs greencolor"><%= subPosts[j].likeCount %></span>
                  <span>
                    <button id="dislike-btn<%= subPosts[j]._id %>" class="vote2 dislikebtn" name="subDislike" type="submit" value="dislike" title="Disagree"><i class="far fa-thumbs-down"></i></button>
                  </span>
                  <span id="dislike-count<%= subPosts[j]._id %>" class="boldtext lightgrey nothing text-xxs"><%= subPosts[j].dislikeCount %></span>
                <% } else if(subVotes.subDislikes.includes(subPosts[j]._id)){ %>
                  <span> 
                    <button id="like-btn<%= subPosts[j]._id %>" class="vote2 likebtn" name="subLike" type="submit" value="like" title="Agree"><i class="far fa-thumbs-up"></i></button>
                  </span>
                  <span id="like-count<%= subPosts[j]._id %>" class="boldtext lightgrey nothing text-xxs"><%= subPosts[j].likeCount %></span>
                  <span>
                    <button id="dislike-btn<%= subPosts[j]._id %>" class="vote2 dislikebtn" name="subDislike" type="submit" value="dislike" title="Disagree"><i class="fas fa-thumbs-down blackcolor"></i></button>
                  </span>
                  <span id="dislike-count<%= subPosts[j]._id %>" class="boldtext lightgrey nothing text-xxs blackcolor"><%= subPosts[j].dislikeCount %></span>
                <% } else{ %>
                  <span> 
                    <button id="like-btn<%= subPosts[j]._id %>" class="vote2 likebtn" name="subLike" type="submit" value="like" title="Agree"><i class="far fa-thumbs-up"></i></button>
                  </span>
                  <span id="like-count<%= subPosts[j]._id %>" class="boldtext lightgrey text-xxs nopad"><%= subPosts[j].likeCount %></span>
                  <span>
                    <button id="dislike-btn<%= subPosts[j]._id %>" class="vote2 dislikebtn" name="subDislike" type="submit" value="dislike" title="Disagree"><i class="far fa-thumbs-down"></i></button>
                  </span>
                  <span id="dislike-count<%= subPosts[j]._id %>" class="boldtext lightgrey text-xxs nopad"><%= subPosts[j].dislikeCount %></span>
                <% } %>
              </form>
            <% } else{ %>
              <span class="mr-2"> 
                <button id="like-btn<%= subPosts[j]._id %>" class="vote2" name="like" type="submit" value="like" title="Agree"><i class="fas fa-thumbs-up"></i></button>
              </span>
              <span class="ml-2">
                <button id="dislike-btn<%= subPosts[j]._id %>" class="vote2" name="dislike" type="submit" value="dislike" title="Disagree"><i class="fas fa-thumbs-down"></i></button>
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
              <div class="grey boldtext text-xs"><%= rankTitle(userRank(subPosts[j].subPostAuthor.id._id)) %></div>
            </div>
            <div class="d-flex flex-column">
              <div class="grey boldtext text-xxs mb-auto"><%= moment(subPosts[j].postedAt).format('lll'); %></div>
              <div class="dropdown ml-auto">
                <button class="btn btn-sm dropdown-toggle editprofile pr-0 py-0" type="button" data-toggle="dropdown"><i class="fas fa-ellipsis-v text-xxs"></i></button>
                <ul class="dropdown-menu dropdown-menu-right dropbox">
                  <div class="container drop-shadow1">
                    <li>
                      <form action="/clubs/<%= clubId %>/posts/<%= post._id %>/subPost/<%= bucket[0]._id %>" method="GET">
                        <button class="dropitems pl-3 link-button text-sm" name="quote" type="submit" value="<%= subPosts[j]._id %>">Quote</button>
                      </form>
                    </li>
                    <li>
                      <form class="delete-form inline" action="" method="POST">
                        <button class="dropitems pl-3 link-button text-sm greyback lightgrey" type="submit" disabled>Flag inappropriate &#127988;</button>
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
            <span class="linewrap text-xs boldtext redcolor">Quote:</span>
            <span class="linewrap text-xs"><strong># <%= subPosts[j].quoteNum %></strong></span>
            <span class="linewrap text-xs"><%= subPosts[j].quoteText %></span>
          </div>
        <% } %>
        <div class="mobiletext linewrap lineheight"><%= subPosts[j].text %></div>
        <% if(subPosts[j].images && subPosts[j].images.length){ %>
          <% for(var k=0;k<subPosts[j].images.length;k++){ %>
            <div class="subPostimg-div" style="border: 1px solid lightgrey;">
              <img class="card-img-top p-1" src="<%= subPosts[j].images[k].image %>">
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
            <a href="/users/<%= currentUser.id %>"><img class="subpostdp my-1" src="<%= CU_50_profilePic %>"></a>
          </div>
          <div class="text-center darkgrey">#<%= post.subpostsCount+1 %></div>
        </div>
        <div class="commentdiv d-flex flex-column">
          <form action="/clubs/<%= clubId %>/posts/<%= post._id %>/discussions" method="POST">
            <div class="valign">
              <div class="d-flex flex-column">
                <div class="darkgrey boldtext subpostbtn"><%= currentUser.fullName %></div>
                <div class="darkgrey boldtext subpostbtn text-xs"><%= rankTitle(rank) %></div>
              </div>
              <div class="darkgrey boldtext text-xs subpostbtn py-2 mb-auto"><%= moment().format('lll'); %></div>
            </div>
            <div class="input-group">
              <textarea onclick="block_display('subpostbtn');" type="text" id="subpostbox" class="form-control nomargin text-sm emoji-input" name="text" placeholder="Add sub-post" rows="4"></textarea>
            </div>
            <div class="d-flex flex-row-reverse">
              <button class="btn btn-sm btn-success subpostbtn btnxs mt-2 ml-2">Submit</button>
              <button onclick="none_display('subpostbtn'); clear_subpost();" class="btn btn-secondary subpostbtn subpostbtn<%= post._id %> btnxs text-sm ml-2 mt-2" type="button">Cancel</button>
              <label for="inputImage" class="custom-file-upload subpostbtn mt-2" title="Upload image">
                <i class="fas fa-upload"></i> Images<sup>10</sup>
              </label>
              <input type="file" id="inputImage" class="text-sm" name="images" accept="image/*">
            </div>
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
    if(rank == 0){return 'Owner';}
    else if(rank == 1){return 'Admin.';}
    else if(rank == 2){return 'Moderator';}
    else if(rank == 3){return 'Sr. member';}
    else if(rank == 4){return 'Jr. member';}
  }
%>
`,{post: response.post, subVotes: response.subVotes, bucket: response.bucket, index: Number(response.index),
  rank: Number(response.rank), currentUser: response.currentUser, clubId: response.clubId,
  CU_50_profilePic: response.CU_50_profilePic, sPA_50_profilePic: response.sPA_50_profilePic});
  return html;
}

function moreMembers_template(response){
  html = ejs.render(`
<div class="row no-gutters lineheight2">
  <% for(var i=0;i<users.length;i++){ %>
    <div class="col-md-1 col-2 py-1 mb-auto">
      <a href="/users/<%= users[i].id._id %>">
      <img class="navdp rounded-circle" src="<%= Users_50_profilePic[i] || '/images/noUser.png' %>"></a>
    </div>
    <div class="col-md-8 col-8 my-auto">
      <span>
        <a href="/users/<%= users[i].id._id %>" class="mobiletext2 grey">
          <strong><%= users[i].id.fullName %></strong>
        </a>
      </span>
      <span class="my-auto lightgrey text-xs">
        <%= users[i].userStatus %>
      </span>
    </div>
    <div class="col-md-3 col-2 my-auto text-right">
      <div class="d-inline-flex">
        <span class="mobileNone">
          <em class="darkgrey text-sm"><%= rankTitle(users[i].userRank) %></em>
        </span>
        <span class="mobileShow">
          <em class="darkgrey text-sm boldtext"><%= users[i].userRank %></em>
        </span>
      </div>
      <span id="user_Rank<%= users[i].id._id %>" class="user_Rank nopad">
        <form action="/status-rank?_method=PUT" method="POST" class="form-inline">
          <label for="userRank" class="sr-only">User rank</label>
          <select id="userRank" name="userRank" class="shortened-select select4" data-toggle="tooltip" title="User rank" onchange="this.form.submit()">
            <option value="-1" data-descr="" disabled selected>&#x25BC;</option>
            <% if(rank == 0){ %>
              <option value="0,<%= users[i].id._id %>,<%= club._id %>" data-descr="Owner">Owner</option>
            <% } %>
            <option value="1,<%= users[i].id._id %>,<%= clubId %>" data-descr="Administrator">Admin</option>
            <option value="2,<%= users[i].id._id %>,<%= clubId %>" data-descr="Moderator">Mod.</option>
            <option value="3,<%= users[i].id._id %>,<%= clubId %>" data-descr="Sr. Member">Sr. M</option>
            <option value="4,<%= users[i].id._id %>,<%= clubId %>" data-descr="Jr. Member">Jr. M</option>
          </select>
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
          <% }; %>
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
          <% }; %>
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
                </form>
              </div>
            </div>
          </div>
        </div>
      <% }; %>
    </div>
  <% }; %>
</div>

<%
  function rankTitle(rank){
    if(rank == 0){return 'Owner';}
    else if(rank == 1){return 'Admin.';}
    else if(rank == 2){return 'Moderator';}
    else if(rank == 3){return 'Sr. member';}
    else if(rank == 4){return 'Jr. member';}
  }
%>
`,{users: response.users, Users_50_profilePic: response.Users_50_profilePic, newEndpoints: response.newEndpoints,
  clubId: response.clubId, rank: response.rank});
  return html;
}

function allTimeTopTopicPosts_template(response){
  html = ejs.render(`
<% if(topTopicPosts.length != 0){ %>
  <% for(var i=0;i<topTopicPosts.length;i++){ %>
  <div class="valign">
    <div class="valign">
      <% if(Posts_50_Image && Posts_50_Image[i] == null){ %>
        <a href="/clubs/<%= club._id %>/posts/<%= topTopicPosts[i]._id %>" class="darkgrey truncate3 linewrap mobiletext2 lineheight2 my-1"><%= topTopicPosts[i].topic %></a>
      <% } else if(Posts_50_Image && Posts_50_Image[i] != null){ %>
        <div>
          <a href="/clubs/<%= club._id %>/posts/<%= topTopicPosts[i]._id %>"><img class="orgdp my-1 mr-2" src="<%= Posts_50_Image[i] || '/images/noClub.png' %>"></a>
        </div>
        <div>
          <a href="/clubs/<%= club._id %>/posts/<%= topTopicPosts[i]._id %>" class="darkgrey truncate3 linewrap mobiletext2 lineheight2 my-1"><%= topTopicPosts[i].topic %></a>
        </div>
      <% } %>
    </div>
    <div class="mb-auto ml-2 mt-1 badge badge-pill badge-secondary text-md"><%= Number(topTopicPosts[i].upVoteCount)-Number(topTopicPosts[i].downVoteCount) %></div>
  </div>
  <% } %>
<% } else{ %>
  <div class="lightgrey mobiletext2">No discussions created yet :/</div>
<% } %>
`,{topTopicPosts: response.topTopicPosts, Posts_50_Image: response.Posts_50_Image});
  return html;
}

function moreClubs_template(response){
  html = ejs.render(`
<div class="row no-gutters lineheight2">
  <% for(var i=0;i<clubs.length;i++){ %>
    <div class="col-md-1 col-2 py-1 mb-auto">
      <a href="/clubs/<%= clubs[i].id._id %>">
      <img class="navdp rounded-circle" src="<%= Clubs_50_clubAvatar[i] || '/images/noClub.png' %>"></a>
    </div>
    <div class="col-md-9 col-8 my-auto">
      <span>
        <a href="/clubs/<%= clubs[i].id._id %>" class="mobiletext2 grey">
          <strong><%= clubs[i].id.name %></strong>
        </a>
      </span>
      <span class="my-auto lightgrey text-xs">
        <%= clubs[i].status %>
        <div class="status" id="status<%= clubs[i].id._id %>">
          <form action="/status-rank?_method=PUT" method="POST">
            <div class="input-group mt-1">
              <input type="text" name="status" class="commentbox1 text-sm form-control form-control-sm" placeholder="<%= clubs[i].status %>">
              <div class="input-group-append">
                <button class="btn btn-secondary btnxxs text-xs" type="submit" name="statusId" value="<%= userId %>,<%= clubs[i].id._id %>">Update</button>
              </div>
            </div>
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
          <em class="darkgrey text-sm boldtext"><%= clubs[i].rank %></em>
        </span>
      </div>
      <span class="dropdown">
        <% if(currentUserId && match){ %>
          <button class="btn btn-sm dropdown-toggle text-xs nothing" type="button" data-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
        <% }; %>
        <ul class="dropdown-menu dropdown-menu-right dropbox">
          <div class="container drop-shadow1">
            <li><a class="dropitems text-sm" href="#!" onclick="toggle_display('status<%= clubs[i].id._id %>')">Update status</a></li>
            <% if(clubs[i].rank != 0){ %>
              <hr>
              <li>
                <button class="dropitems link-button red text-sm" href="#leaveClubModal<%= user._id %><%= clubs[i].id._id %>" data-toggle="modal">Leave <%= clubs[i].id.name %></button>
              </li>
            <% } %>
          </div>
        </ul>
      </span>
      <!-- Modal HTML -->
      <div id="leaveClubModal<%= user._id %><%= clubs[i].id._id %>" class="fixed-padding modal fade">
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
                <button type="submit" name="leave" value="<%= user._id %>,<%= clubs[i].id._id %>" class="btn btn-danger btn-sm ml-1">Leave</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  <% }; %>
</div>

<%
  function rankTitle(rank){
    if(rank == 0){return 'Owner';}
    else if(rank == 1){return 'Admin.';}
    else if(rank == 2){return 'Moderator';}
    else if(rank == 3){return 'Sr. member';}
    else if(rank == 4){return 'Jr. member';}
  }
%>
`,{clubs: response.clubs, clubCount: response.clubCount, Clubs_50_clubAvatar: response.Clubs_50_clubAvatar,
  newEndpoints: response.newEndpoints, userId: response.userId, rank: response.rank,
  currentUserId: response.currentUserId, match: response.match});
  return html;
}

function search_people_template(response){
  html = ejs.render(`
<% var len = users.length; var k=0; for(k;k<len;k++){ %>
  <div class="card searchcard2">
    <div class="d-flex flex-row">
      <div>
        <a href="/users/<%= users[k]._id %>">
          <img class="searchdp" src="<%= users[k].profilePic || '/images/noUser.png' %>">
        </a>
      </div>
      <div class="card-body3 lineheight2 fullwidth" style="overflow: hidden;">
        <div class="valign">
          <div>
            <a href="/users/<%= users[k]._id %>" class="grey">
              <span class="nothing text-lg"><strong class="searchname"><%= users[k].fullName %></strong></span>
            </a>
          </div>
          <div>
            <% if(currentUser && users[k]._id == currentUser._id){ %>
              <button class="btn btn-white btnxxs text-sm noshadow nopoint nowrap" type="button">
                <i class="fas fa-ghost" aria-hidden="true"></i> Me</button>
            <% } else if(currentUser && !users[k]._id == currentUser._id){ 
              currentUser.friends.forEach(function(friend){ 
                if(users[k]._id == friend){ %>
                <button class="btn btn-white btnxxs text-sm noshadow nopoint nowrap" type="button">
                  <i class="fas fa-check"></i> Friends</button>
            <% }})} %>
          </div>
        </div>
        <div class="lightgrey text-xs"><%= users[k].note %></div>
        <br>
        <div class="valign">
          <div>
            <div class="text-sm boldtext darkgrey"><%= users[k].email %></div>
            <% if(users[k].userKeys){ %>
              <div class="lightgrey text-xs"><%= users[k].userKeys.workplace %></div>
              <div class="lightgrey text-xs"><%= users[k].userKeys.college %></div>
              <div class="lightgrey text-xs"><%= users[k].userKeys.school %></div>
            <% } %>
          </div>
          <% if(users[k].userKeys){ %>
            <div class="darkgrey text-sm mt-auto"><%= users[k].userKeys.residence %></div>
          <% } %>
        </div>
      </div>
    </div>
  </div>
<% } %>
`,{users: response.users, query: response.query, foundUserIds: response.foundUserIds, currentUser: response.currentUser});
  return html;
}

function search_clubs_template(response){
  html = ejs.render(`
<% var len = clubs.length; var k=0; for(k;k<len;k++){ %>
  <div class="card searchcard2">
    <div class="d-flex flex-row">
      <div>
        <a href="/clubs/<%= clubs[k]._id %>">
          <img class="searchdp" src="<%= clubs[k].avatar || '/images/noClub.png' %>">
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
                <button class="btn btn-white btnxxs text-sm noshadow nopoint nowrap" type="button">
                  <i class="fas fa-check"></i> Member</button>
            <% }})} %>
          </div>
        </div>
        <div class="lightgrey text-xs"><%= clubs[k].banner %></div>
        <br>
        <% if(clubs[k].clubKeys){ %>
          <div class="text-sm boldtext darkgrey"><%= clubs[k].clubKeys.weblink %></div>
          <div class="lightgrey text-xs"><%= clubs[k].clubKeys.grouptype %></div>
          <div class="lightgrey text-xs"><%= clubs[k].clubKeys.organization %></div>
        <% } %>
        <div class="valign">
          <div class="lightgrey text-xs"><%= break_arr(clubs[k].categories) %></div>
          <% if(clubs[k].clubKeys){ %>
            <div class="darkgrey text-sm mt-auto"><%= clubs[k].clubKeys.location %></div>
          <% } %>
        </div>
      </div>
    </div>
  </div>
<% } %>

<%
function break_arr(arr){
  for(i=0;i<arr.length;i++){
    if(i == 0){
      var str = arr[i];
    } else{
      var str = str +', '+ arr[i];
    }
  }
  return str;
}
%>
`,{clubs: response.clubs, query: response.query, foundClubIds: response.foundClubIds, currentUser: response.currentUser});
  return html;
}

function search_org_pages_template(response){
  html = ejs.render(`
<% var len = org_pages.length; var k=0; for(k;k<len;k++){ %>
  <div class="card searchcard2">
    <div class="d-flex flex-row">
      <div class="card-body3 lineheight2 fullwidth" style="overflow: hidden;">
        <div class="valign organization p-2">
          <a href="/org_pages/<%= org_pages[k].name %>" class="black">
            <span class="nothing text-md searchname boldtext text-lg"><%= org_pages[k].name %></span>
          </a>
        </div>
        <br>
        <div class="darkgrey text-sm text-right">
          <span>[<span class="boldtext"><%= org_pages[k].clubCount %></span> clubs</span>
          <span><span class="boldtext"><%= org_pages[k].userCount %></span> members]</span>
        </div>
      </div>
    </div>
  </div>
<% } %>
`,{org_pages: response.org_pages, query: response.query, foundOrgPageIds: response.foundOrgPageIds, currentUser: response.currentUser});
  return html;
}