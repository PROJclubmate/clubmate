const socket = io();
if(socket !== undefined){
  // console.log('Connected to socket...');
  
  var userChatStatusReset = null; var clubChatStatusReset = null;
  $.ajaxSetup({headers: {'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')}});
  // ============================================== USER CHAT ================================================= //
  // 1). DOM EVENTS
  $(() =>{
    // Run when page loads
    $(() =>{
      if($("#user-convoId").hasClass("user-convoId")){
        var convIdrecpId = $("#user-convoId").attr("value").split(',');
        var conversationId = convIdrecpId[0];
        var recipientId = convIdrecpId[1];
        socket.emit('joinRoom', conversationId);
        getMessages({
          conversationId: conversationId,
          recipientId: recipientId
        })
      }
    });
    // Handle input
    $("#user-send").click(()=>{
      var composedMessage = $("#user-message").val();
      if(composedMessage && composedMessage != ''){
        var convIdrecpIdcurrId = $("#user-convoId").attr("value").split(',');
        var conversationId = convIdrecpIdcurrId[0];
        var recipientId = convIdrecpIdcurrId[1];
        var authorId = convIdrecpIdcurrId[2];
        sendMessage({
          composedMessage: composedMessage,
          conversationId: conversationId,
          recipientId: recipientId,
          authorId: authorId
        });
        socket.emit('notTyping', $("#chatbox-loadingarea").attr("value"));
      } else{
        setStatus('Pl. enter a message');
      }
      $("#user-send").blur();
      $("#user-message").val('').focus();
    });
  });

  // 2). SOCKET EVENTS
  // Status
  var setStatus = function(s){
    var statusPrevious = $("#msg-status").text();
    $("#msg-status").text(s);
    // Rollback to prev status
    // BUG => If status update when statusPrev == Idle, stays Idle untill new msg / clear typing
    if(s !== 'Status: Idle' && !s.endsWith('typing...')){
      var delay = setTimeout(function(){
        setStatus(statusPrevious);
      }, 3000);
    }
  }
  $("#user-message").focus(function(){
    var conversationId = $("#user-convoId").attr("value").split(',')[0];
    $.post('/seen_msg/'+conversationId);
  });
  // Listen
  socket.on('someoneJoinedRoom', function(){
    $("#isUserInRoom").html("<circle cx='6' cy='6' r='4' stroke='#56b0f0' stroke-width='1' fill='#92cbf5'/>");
  })
  socket.on('someoneLeftRoom', function(){
    $("#isUserInRoom").html("<circle cx='6' cy='6' r='4' stroke='#60b769' stroke-width='1' fill='#9feca6'/>");
  })

  // Emit typing
  var pastInputLength = 0;
  $("#user-message").on('input', function(){
    if((pastInputLength == 0 && $("#user-message").val().length > 0) || userChatStatusReset === true){
      socket.emit('typing', $("#chatbox-loadingarea").attr("value"));
      userChatStatusReset = false;
    } else if(pastInputLength != 0 && $("#user-message").val().length == 0){
      socket.emit('notTyping', $("#chatbox-loadingarea").attr("value"));
    }
    pastInputLength = $("#user-message").val().length;
  });
  // Listen on typing (status from server)
  socket.on('typing', function(data){
    setStatus(data + ' is typing...');
  });
  socket.on('notTyping', function(data){
    setStatus('Status: Idle');
    userChatStatusReset = true;
  });
  // From routes.js
  socket.on('message', newMessage)

  // 3). FUNCTIONS
  function addMessages(data){
    var prevDate, prevDate2, prevAuthorId;
    $('#load-prevMsgs-btn').val(data.foundMessageIds);
    if(data.messages.bucketNum > 2){
      $('#load-prevMsgs-btn').removeClass('nodisplay');
    }
    for(i=data.messages.messageBuckets.length-1;i>=0;i--){
      data.messages.messageBuckets[i].messages.forEach(function(message){
        if(moment(message.createdAt).format("MMM Do YY") != prevDate){
          $("#messages_container").append(`
            <div class="chat-head3"> ${moment(message.createdAt).format("MMM Do YY")} </div>`);
        }
        if(message.authorId == data.currentUser){
          if(moment(message.createdAt).format('LT') != prevDate2){
            if(prevAuthorId != message.authorId || moment(message.createdAt).format("MMM Do YY") != prevDate){
              $("#messages_container").append(`
                <div class="flex-end mt-2"><div class="chat-msg2"><div class="chat-msg-div"> ${message.text} </div><div class="chat-head2">
                ${moment(message.createdAt).format('LT')} </div></div></div>`);
            } else{
              $("#messages_container").append(`
                <div class="flex-end"><div class="chat-msg2" style="border-radius: 0.5rem 0.375rem 0.5rem 0.5rem;">
                <div class="chat-msg-div"> ${message.text} </div><div class="chat-head2">
                ${moment(message.createdAt).format('LT')} </div></div></div>`);
            }
          } else{
            if(prevAuthorId != message.authorId || moment(message.createdAt).format("MMM Do YY") != prevDate){
              $("#messages_container").append(`
                <div class="flex-end mt-2"><div class="chat-msg2"><div class="chat-msg-div"> ${message.text} </div></div></div>`);
            } else{
              $("#messages_container").append(`
                <div class="flex-end"><div class="chat-msg2" style="border-radius: 0.5rem 0.375rem 0.5rem 0.5rem;">
                <div class="chat-msg-div"> ${message.text} </div></div></div>`);
            }
          }
        } else{
          if(moment(message.createdAt).format('LT') != prevDate2){
            if(prevAuthorId != message.authorId || moment(message.createdAt).format("MMM Do YY") != prevDate){
              $("#messages_container").append(`
                <div class="mt-2"><div class="chat-msg"><div class="chat-msg-div"> ${message.text} </div><div class="chat-head">
                ${moment(message.createdAt).format('LT')} </div></div></div>`);
            } else{
              $("#messages_container").append(`
                <div><div class="chat-msg" style="border-radius: 0.375rem 0.5rem 0.5rem 0.5rem;">
                <div class="chat-msg-div"> ${message.text} </div><div class="chat-head">
                ${moment(message.createdAt).format('LT')} </div></div></div>`);
            }
          } else{
            if(prevAuthorId != message.authorId || moment(message.createdAt).format("MMM Do YY") != prevDate){
              $("#messages_container").append(`
                <div class="mt-2"><div class="chat-msg"><div class="chat-msg-div"> ${message.text} </div></div></div>`);
            } else{
              $("#messages_container").append(`
                <div><div class="chat-msg" style="border-radius: 0.375rem 0.5rem 0.5rem 0.5rem;">
                <div class="chat-msg-div"> ${message.text} </div></div></div>`);
            }
          }
        }
        prevDate = moment(message.createdAt).format("MMM Do YY");
        prevDate2 = moment(message.createdAt).format("LT");
        prevAuthorId = message.authorId;
      });
    }
    chatBoxOnLoad()
  }
  function newMessage(data){
    var convIdrecpIdcurrId = $("#user-convoId").attr("value").split(',');
    var currentUserId = convIdrecpIdcurrId[2];
    var prevAuthorId = $('#lastMsgBy').attr('value');
    if(currentUserId == data.authorId){
      if(data.authorId == prevAuthorId){
        $("#messages_container").append(`
          <div class="flex-end"><div class="chat-msg2 chat-msg-div" style="border-radius: 0.5rem 0.375rem 0.5rem 0.5rem;"> ${data.composedMessage} </div></div>`);
      } else{
        $("#messages_container").append(`
          <div class="flex-end mt-2"><div class="chat-msg2 chat-msg-div"> ${data.composedMessage} </div></div>`);
      }
    } else{
      if(data.authorId == prevAuthorId){
        $("#messages_container").append(`
          <div><div class="chat-msg chat-msg-div" style="border-radius: 0.375rem 0.5rem 0.5rem 0.5rem;"> ${data.composedMessage} </div></div>`);
      } else{
        $("#messages_container").append(`
          <div class="mt-2"><div class="chat-msg chat-msg-div"> ${data.composedMessage} </div></div>`);
      }
    }
    $('#lastMsgBy').attr('value', data.authorId);
    scrollToNext()
  }
  function getMessages(conversation){
    if(conversation.conversationId == ''){
      $('#load-prevMsgs-btn').addClass('nodisplay');
      $("#messages_container").append(`
        <div class="chat-msg3"><span class="boldtext"> Start a conversation 👋 </span></div> <br>`);
    } else{
      $.get('/chat/'+conversation.conversationId, (data) =>{
        $('#lastMsgBy').attr('value', data.messages.lastMsgBy);
        addMessages(data);
      })
    }
  }
  function sendMessage(message){
    if(message.conversationId == ''){
      $.post('/new/chat', message);
      setStatus('Conversation started!');
      socket.emit('newConvoReload', message.authorId);
      location.reload(true);
    } else if(message.recipientId == ''){
      $.post('/chat/'+message.conversationId, message);
    }
  }




  // ================================================ CLUB CHAT =============================================== //
  $(() =>{
    $(() =>{
      if($("#club-convoId").hasClass("club-convoId")){
        var convIdclubId = $("#club-convoId").attr("value").split('^');
        var conversationId = convIdclubId[0];
        var clubId = convIdclubId[1];
        socket.emit('joinClubRoom', conversationId);
        getClubMessages({
          conversationId: conversationId,
          clubId: clubId
        })
      }
    });
    $("#club-send").click(()=>{
      var composedMessage = $("#club-message").val();
      if(composedMessage && composedMessage != ''){
        var convIdclubIdcurrIdcurrFullNameProfilePic = $("#club-convoId").attr("value").split('^');
        var conversationId = convIdclubIdcurrIdcurrFullNameProfilePic[0];
        var clubId = convIdclubIdcurrIdcurrFullNameProfilePic[1];
        var authorId = convIdclubIdcurrIdcurrFullNameProfilePic[2];
        var authorFullName = convIdclubIdcurrIdcurrFullNameProfilePic[3];
        var authorprofilePic = convIdclubIdcurrIdcurrFullNameProfilePic[4];
        sendClubMessage({
          composedMessage: composedMessage,
          conversationId: conversationId,
          clubId: clubId,
          authorId: authorId,
          authorName: authorFullName,
          authorProfilePic: authorprofilePic
        });
        socket.emit('notClubTyping', $("#chatbox-loadingarea").attr("value"));
      } else{
        setClubStatus('Pl. enter a message');
      }
      $("#club-send").blur();
      $("#club-message").val('').focus();
    });
  });

  var setClubStatus = function(s){
    var clubStatusPrevious = $("#club-msg-status").text();
    $("#club-msg-status").text(s);
    if(s !== 'Status: Idle' && !s.endsWith('typing...')){
      var delay = setTimeout(function(){
        setClubStatus(clubStatusPrevious);
      }, 3000);
    }
  }
  $("#club-message").focus(function(){
    var conversationId = $("#club-convoId").attr("value").split('^')[0];
    $.post('/seen_clubmsg/'+conversationId);
  });

  socket.on('updateClubRoomConnectionsNum', function(data){
    $("#clubRoomConnectionsNum").text(data);
  });
  socket.on('someoneJoinedClubRoom', function(){
    $("#isUserInClubRoom").html("<circle cx='6' cy='6' r='4' stroke='#56b0f0' stroke-width='1' fill='#92cbf5'/>");
  })
  socket.on('everyoneLeftClubRoom', function(){
    $("#isUserInClubRoom").html("<path d='M7.2 1.8A4.5 4.5 90 1010.8 7.2 3.375 3.375 90 117.2 1.8z' stroke='#f9af4a' stroke-width='1' fill='#ffdfaf'/>");
  })

  var pastClubInputLength = 0;
  $("#club-message").on('input', function(){
    if((pastClubInputLength == 0 && $("#club-message").val().length > 0) ||  clubChatStatusReset === true){
      socket.emit('clubTyping', $("#chatbox-loadingarea").attr("value"));
      clubChatStatusReset = false;
    } else if(pastClubInputLength != 0 && $("#club-message").val().length == 0){
      socket.emit('notClubTyping', $("#chatbox-loadingarea").attr("value"));
    }
    pastClubInputLength = $("#club-message").val().length;
  });
  socket.on('clubTyping', function(data){
    setClubStatus(data + ' is typing...');
  });
  socket.on('notClubTyping', function(data){
    setClubStatus('Status: Idle');
    clubChatStatusReset = true;
  });
  socket.on('newConvoReload', function(data){
    if(location.pathname.split('/').pop() == data){
      location.reload(true);
    }
  });
  socket.on('newClubConvoReload', function(data){
    if(location.pathname.split('/').pop() == data){
      location.reload(true);
    }
  });
  socket.on('clubMessage', newClubMessage);

  function addClubMessages(data){
    var prevDate, prevAuthorId;
    $('#load-prevMsgs-btn').val(data.foundMessageIds);
    if(data.messages.bucketNum > 2){
      $('#load-prevMsgs-btn').removeClass('nodisplay');
    }
    for(i=data.messages.messageBuckets.length-1;i>=0;i--){
      data.messages.messageBuckets[i].messages.forEach(function(message, j){
        if(moment(message.createdAt).format("MMM Do YY") != prevDate){
          $("#messages_container").append(`
            <div class="chat-head3"> ${moment(message.createdAt).format("MMM Do YY")} </div>`);
        }
        if(message.authorId._id == data.currentUser){
          if(prevAuthorId != message.authorId._id || moment(message.createdAt).format("MMM Do YY") != prevDate){
            $("#messages_container").append(`
              <div class="flex-end"><div class="chat-msg2"><div class="chat-head2 chat-head-clubpad"><span> ${data.firstName} </span>
              <span> ${moment(message.createdAt).format('LT')} </span></div><div class="clubchat-msg-div"> ${message.text}</div> </div></div>`);
          } else{
            $("#messages_container").append(`
              <div class="flex-end"><div class="chat-msg2" style="border-radius: 0.5rem 0.375rem 0.5rem 0.5rem;">
              <div class="clubchat-msg-div"> ${message.text}</div> </div></div>`);
          }
        } else{
          if(prevAuthorId != message.authorId._id || moment(message.createdAt).format("MMM Do YY") != prevDate){
            $("#messages_container").append(`
              <div class="d-flex flex-row"><div>
              <a href="/users/${message.authorId._id}"><img class="chatdp rounded-circle" src="${data.MA_50_profilePic[i][j]}"></a></div>
              <div><div class="chat-msg"><div class="chat-head chat-head-clubpad bluecolor"><span class="text-xs"> ${message.authorName} </span>
              <span> ${moment(message.createdAt).format('LT')} </span></div><div class="clubchat-msg-div"> ${message.text}</div> </div></div></div>`);
          } else{
            $("#messages_container").append(`
              <div class="d-flex flex-row"><div>
              <a href="/users/${message.authorId._id}"><img class="chatdp rounded-circle transparent2" src="${data.MA_50_profilePic[i][j]}"></a></div>
              <div><div class="chat-msg" style="border-radius: 0.375rem 0.5rem 0.5rem 0.5rem;"><div class="clubchat-msg-div"> ${message.text}</div> </div></div></div>`);
          }
        }
        prevDate = moment(message.createdAt).format("MMM Do YY");
        prevAuthorId = message.authorId._id;
      });
    }
    chatBoxOnLoad()
  }
  function newClubMessage(data){
    var currFirstName = $("#chatbox-loadingarea").attr("value");
    var convIdclubIdcurrIdcurrFullNameProfilePic = $("#club-convoId").attr("value").split('^');
    var currentUserId = convIdclubIdcurrIdcurrFullNameProfilePic[2];
    var prevAuthorId = $('#lastMsgBy').attr('value');
    if(currentUserId == data.authorId){
      if(data.authorId == prevAuthorId){
        $("#messages_container").append(`
          <div class="flex-end"><div class="chat-msg2" style="border-radius: 0.5rem 0.375rem 0.5rem 0.5rem;">
          <div class="chat-head2 chat-head-clubpad"><span></span> ${currFirstName} </div>
          <div class="clubchat-msg-div"> ${data.composedMessage} </div></div></div>`);
      } else{
        $("#messages_container").append(`
          <div class="flex-end"><div class="chat-msg2"><div class="chat-head2 chat-head-clubpad"><span></span> ${currFirstName} </div>
          <div class="clubchat-msg-div"> ${data.composedMessage} </div></div></div>`);
      }
    } else{
      if(data.authorId == prevAuthorId){
        $("#messages_container").append(`
          <div class="d-flex flex-row"><div>
          <a href="/users/${data.authorId}"><img class="chatdp rounded-circle transparent2" src="${data.authorProfilePic}"></a></div>
          <div><div class="chat-msg" style="border-radius: 0.375rem 0.5rem 0.5rem 0.5rem;">
          <div class="chat-head chat-head-clubpad bluecolor"><span class="text-xs"> ${data.authorName} </span></div>
          <div class="clubchat-msg-div"> ${data.composedMessage}</div></div></div></div>`);
      } else{
        $("#messages_container").append(`
          <div class="d-flex flex-row"><div>
          <a href="/users/${data.authorId}"><img class="chatdp rounded-circle transparent" src="${data.authorProfilePic}"></a></div>
          <div><div class="chat-msg"><div class="chat-head chat-head-clubpad bluecolor" class="text-xs"> ${data.authorName} </div>
          <div class="clubchat-msg-div"> ${data.composedMessage} </div></div></div></div>`);
      }
    }
    $('#lastMsgBy').attr('value', data.authorId);
    scrollToNext()
  }
  function getClubMessages(conversation){
    if(conversation.conversationId == ''){
      $('#load-prevMsgs-btn').addClass('nodisplay');
      $("#messages_container").append(`
        <div class="chat-msg3"><span class="boldtext"> Start a conversation 👋 </span></div> <br>`);
      chatBoxOnLoad();
    } else{
      $.get('/club-chat/'+conversation.conversationId, (data) =>{
        $('#lastMsgBy').attr('value', data.messages.lastMsgBy);
        addClubMessages(data);
      })
    }
  }
  function sendClubMessage(message){
    if(message.conversationId == ''){
      $.post('/new/club-chat', message);
      setClubStatus('Conversation started!');
      socket.emit('newClubConvoReload', message.clubId);
      location.reload(true);
    } else if(message.clubId == ''){
      $.post('/club-chat/'+message.conversationId, message);
    }
  }


  // ==================================== MISC. SCROLL CHATBOX ======================================== //
  function scrollToNext(){
    var checkbottom; var msgbox = $("#messages_container");
    // slack of about two one liners ~ 100px
    var diff = ((msgbox.scrollTop() + msgbox.innerHeight() + 200) - msgbox[0].scrollHeight);
    var check = diff>0;
    if(check){
      checkbottom = "bottom";
    } else{
    checkbottom = "nobottom";
    }
    if (checkbottom == "bottom"){
      var currHeight = msgbox.scrollTop();
      msgbox.animate({scrollTop: currHeight+500}, 3500);
    }
  }
  function chatBoxOnLoad(){
    setTimeout(function(){
      if($('#messages_container')[0]){
        if($('#messages_container')[0].scrollHeight == 0){
          $('#messages_container').animate({scrollTop: 10000}, 1);
          $('#chatbox-loadingarea.chatbox-loadingarea2').css('visibility', 'visible');
        } else{
          $('#messages_container').animate({scrollTop: $('#messages_container')[0].scrollHeight}, 1);
          $('#chatbox-loadingarea.chatbox-loadingarea2').css('visibility', 'visible');
        }
      }
    }, 100);
    if(window.innerWidth > 767 || $('#chatbox-loadingarea').hasClass('chatbox-loadingarea2')){
      $("#chatbox").addClass('show');
    } else{
      $("#chatbox").removeClass('show');
      if($("#emoji-box").hasClass('right')){
        $("#emoji-box").toggleClass('emoji-right');
      }
    }
  }
  
  $("#block-user-span").click(()=>{
    var conversationId = $("#user-convoId").attr("value").split(',')[0];
    if($("#block-user").attr("value") == 'true'){
      $.post('/block/'+conversationId, $("#block-user").attr("value"));
      $("#block-user").attr("value","false");
      $("#block-user").attr("title","Unblock user");
      $("#block-user").addClass('redcolor');
      setStatus('BLOCKED!');
    } else if($("#block-user").attr("value") == 'false'){
      $.post('/block/'+conversationId, $("#block-user").attr("value"));
      $("#block-user").attr("value","true");
      $("#block-user").attr("title","Block user");
      $("#block-user").removeClass('redcolor');
      setStatus('UNBLOCKED!');
    }
  });
}
