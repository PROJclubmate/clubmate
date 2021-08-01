// VIEW Participants

$('#viewParticipantsBtn').on('click', function(){
  $('#leave_delete_btn').addClass('nodisplay');
  $('#participantsSearchViewOnly').removeClass('nodisplay');
  searchRoomParticipantsViewOnly($('#participantsSearchViewOnly').val());
});

const searchRoomParticipantsViewOnly = async searchText => {
  const clubMembersList = JSON.parse($('#clubMembersList').html());
  const roomParticipantsList = JSON.parse($('#roomParticipantsList').html());
  const currentUserId = $('#navname').attr('value');
  let matches = clubMembersList.filter(state => {
    const regex = new RegExp(`^${searchText}`, 'gi');
    return state.fullName.match(regex);
  });

  $('#matchDisplayRemove').html(showParticipantMatchesViewOnly_template(matches, roomParticipantsList, currentUserId));
};

$('#participantsSearchViewOnly').on('input', function(){
  searchRoomParticipantsViewOnly($('#participantsSearchViewOnly').val());
});

function showParticipantMatchesViewOnly_template(matches, roomParticipantsList, currentUserId){
  html = ejs.render(`
  <% if(matches.length > 0){ %>
    <% for(var i=0;i<matches.length;i++){ %>
      <% if(roomParticipantsList.includes(matches[i]._id)){ %>
        <% if(matches[i]._id == currentUserId){ %>
          <div id="participantId<%= matches[i]._id %>" class="card card-body3 mb-1" 
          profilePic="<%= matches[i].profilePic %>" sex="<%= matches[i].userKeys.sex %>" style="border: 1px dashed #a8aaac;">
        <% } else{ %>
          <div id="participantId<%= matches[i]._id %>" class="card card-body3 mb-1" 
          profilePic="<%= matches[i].profilePic %>" sex="<%= matches[i].userKeys.sex %>">
        <% } %>
          <div class="px-2 py-1">
            <div class="d-flex flex-row">
              <div id="participantStatus<%= matches[i]._id %>" class="my-auto grey invisible"><i class="fas fa-plus"></i></div>
              <div class="mx-3">
                <% if(matches[i].userKeys.sex == 'Male'){ %>
                  <img class="navdp rounded-circle" src="<%= matches[i].profilePic || '/images/noUserMale.png' %>">
                <% } else if(matches[i].userKeys.sex == 'Female'){ %>
                  <img class="navdp rounded-circle" src="<%= matches[i].profilePic || '/images/noUserFemale.png' %>">
                <% } %>
              </div>
              <div class="my-auto fullwidth">
                <div class="valign">
                  <div class="grey">
                    <span class="grey mobiletext">
                      <strong><%= matches[i].fullName %></strong>
                      <% if(matches[i].userKeys.batch){ %>
                        , <%= matches[i].userKeys.batch %>
                      <% } %>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      <% } %>
    <% } %>
  <% } %>
`, {matches, roomParticipantsList, currentUserId});
  return html;
}

// ADD Partipipants

$('#addParticipantsBtn').on('click', function(){
  $('#leave_delete_btn').addClass('nodisplay');
  $('#membersSearch').removeClass('nodisplay');
  $('#removeParticipantsBtn').addClass('invisible');
  searchClubMembers($('#membersSearch').val());
});

const searchClubMembers = async searchText => {
  const clubMembersList = JSON.parse($('#clubMembersList').html());
  const roomParticipantsList = JSON.parse($('#roomParticipantsList').html());
  const toBeAddedParticipants = $('#addedParticipantsDisplay').attr('value').split(',').filter(item => item);
  const currentUserId = $('#navname').attr('value');
  let matches = clubMembersList.filter(state => {
    const regex = new RegExp(`^${searchText}`, 'gi');
    return state.fullName.match(regex);
  });

  $('#matchDisplayAdd').html(showMemberMatches_template(matches, roomParticipantsList, toBeAddedParticipants, currentUserId));
};

$('#membersSearch').on('input', function(){
  searchClubMembers($('#membersSearch').val());
});

$('#matchDisplayAdd').on('click', '.memberElem', function(e){
  const id = $(this).attr('id').substring(13);
  const profilePic = $(this).attr('profilePic');
  const sex = $(this).attr('sex');
  const status = $('#participantStatus'+id);
  const countDisplay = $('#participantsCount');

  if(status.html() == '<i class="fas fa-minus"></i>'){
    let newValue = Number(countDisplay.attr('value')) + 1;
    if(newValue > 0){
      if($('#addParticipantsSubmitBtn').hasClass('nodisplay')){
        $('#addParticipantsBtn').addClass('nodisplay');
        $('#addParticipantsSubmitBtn').removeClass('nodisplay');
        $('#removeParticipantsBtn').addClass('invisible');
      }
    }
    countDisplay.attr('value', newValue);
    countDisplay.html('<span class="d-inline-flex">'+newValue+ '<span class="mobileNone mx-1">participants</span> to be added'+'</span>');
    status.html('<i class="fas fa-plus"></i>');
    $('#addedParticipantsDisplay').html(
      $('#addedParticipantsDisplay').html() + addedParticipantsDisplay_template(profilePic, sex)
    );
    if($('#addedParticipantsDisplay').attr('value') == ''){
      $('#addedParticipantsDisplay').attr('value', id);
    } else{
      $('#addedParticipantsDisplay').attr('value', $('#addedParticipantsDisplay').attr('value') +','+id);
    }
  } else if(status.html() == '<i class="fas fa-plus"></i>'){
    let newValue = Number(countDisplay.attr('value')) - 1;
    if(newValue == 0){
      if($('#addParticipantsBtn').hasClass('nodisplay')){
        $('#addParticipantsBtn').removeClass('nodisplay');
        $('#addParticipantsSubmitBtn').addClass('nodisplay');
        $('#removeParticipantsBtn').removeClass('invisible');
        $('#matchDisplayAdd').html('');
        $('#membersSearch').addClass('nodisplay');
      }
    }
    countDisplay.attr('value', newValue);
    countDisplay.html('<span class="d-flex">'+newValue+ '<span class="mobileNone mx-1">participants</span> to be added'+'</span>');
    status.html('<i class="fas fa-minus"></i>');
    $('#addedParticipantsDisplay').html(
      $('#addedParticipantsDisplay').html().replace(addedParticipantsDisplay_template(profilePic, sex), '')
    );
    let newArr = $('#addedParticipantsDisplay').attr('value').split(',').filter(val => val !== id);
    $('#addedParticipantsDisplay').attr('value', newArr);
  }
});

$('#addParticipantsSubmitBtn').on('click', function(){
  const newParticipantsToBeAdded = $('#addedParticipantsDisplay').attr('value').split(',');
  const csrfToken = $(this).attr('csrf-token');
  const roomId = $('#roomName').attr('value');
  const clubId = $('#clubName').attr('value');
  $(`<form action="/clubs/${clubId}/rooms/${roomId}/edit?_method=PUT" method="POST">
    <input type="hidden" name="addParticipants" value="${newParticipantsToBeAdded}">
    <input type="hidden" name="_csrf" value="${csrfToken}">
  </form>`).appendTo('body').submit();
});

// Show results in HTML
function showMemberMatches_template(matches, roomParticipantsList, toBeAddedParticipants, currentUserId){
  html = ejs.render(`
  <% if(matches.length > 0){ %>
    <% for(var i=0;i<matches.length;i++){ %>
      <% if(!roomParticipantsList.includes(matches[i]._id)){ %>
        <% if(matches[i]._id == currentUserId){ %>
          <div id="participantId<%= matches[i]._id %>" class="memberElem card card-body3 mb-1 pointer" 
          profilePic="<%= matches[i].profilePic %>" sex="<%= matches[i].userKeys.sex %>" style="border: 1px dashed #4aac71;">
        <% } else{ %>
          <div id="participantId<%= matches[i]._id %>" class="memberElem card card-body3 mb-1 pointer" 
          profilePic="<%= matches[i].profilePic %>" sex="<%= matches[i].userKeys.sex %>">
        <% } %>
          <div class="px-2 py-1">
            <div class="d-flex flex-row">
              <% if(!toBeAddedParticipants.includes(matches[i]._id)){ %>
                <div id="participantStatus<%= matches[i]._id %>" class="my-auto grey"><i class="fas fa-minus"></i></div>
              <% } else{ %>
                <div id="participantStatus<%= matches[i]._id %>" class="my-auto grey"><i class="fas fa-plus"></i></div>
              <% } %>
              <div class="mx-3">
                <% if(matches[i].userKeys.sex == 'Male'){ %>
                  <img class="navdp rounded-circle" src="<%= matches[i].profilePic || '/images/noUserMale.png' %>">
                <% } else if(matches[i].userKeys.sex == 'Female'){ %>
                  <img class="navdp rounded-circle" src="<%= matches[i].profilePic || '/images/noUserFemale.png' %>">
                <% } %>
              </div>
              <div class="my-auto fullwidth">
                <div class="valign">
                  <div class="grey">
                    <span class="grey mobiletext">
                      <strong><%= matches[i].fullName %></strong>
                      <% if(matches[i].userKeys.batch){ %>
                        , <%= matches[i].userKeys.batch %>
                      <% } %>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      <% } %>
    <% } %>
  <% } %>
`, {matches, roomParticipantsList, toBeAddedParticipants, currentUserId});
  return html;
}

function addedParticipantsDisplay_template(profilePic, sex){
  html = ejs.render(`
  <% if(sex == 'Male'){ %>
    <img class="navdp rounded-circle mr-2" src="<%= profilePic || '/images/noUserMale.png' %>">
  <% } else if(sex == 'Female'){ %>
    <img class="navdp rounded-circle" src="<%= profilePic || '/images/noUserFemale.png' %>">
  <% } %>
`, {profilePic, sex});
  return html;
}

// REMOVE Participants

$('#removeParticipantsBtn').on('click', function(){
  $('#leave_delete_btn').addClass('nodisplay');
  $('#participantsSearch').removeClass('nodisplay');
  $('#addParticipantsBtn').addClass('invisible');
  searchRoomParticipants($('#participantsSearch').val());
});

const searchRoomParticipants = async searchText => {
  const clubMembersList = JSON.parse($('#clubMembersList').html());
  const roomParticipantsList = JSON.parse($('#roomParticipantsList').html());
  const toBeRemovedParticipants = $('#removedParticipantsDisplay').attr('value').split(',').filter(item => item);
  const currentUserId = $('#navname').attr('value');
  let matches = clubMembersList.filter(state => {
    const regex = new RegExp(`^${searchText}`, 'gi');
    return state.fullName.match(regex);
  });

  $('#matchDisplayRemove').html(showParticipantMatches_template(matches, roomParticipantsList, toBeRemovedParticipants, currentUserId));
};

$('#participantsSearch').on('input', function(){
  searchRoomParticipants($('#participantsSearch').val());
});

$('#matchDisplayRemove').on('click', '.participantElem', function(e){
  const id = $(this).attr('id').substring(13);
  const profilePic = $(this).attr('profilePic');
  const sex = $(this).attr('sex');
  const status = $('#participantStatus'+id);
  const countDisplay = $('#participantsCount');

  if(status.html() == '<i class="fas fa-plus"></i>'){
    let newValue = Number(countDisplay.attr('value')) + 1;
    if(newValue > 0){
      if($('#removeParticipantsSubmitBtn').hasClass('nodisplay')){
        $('#removeParticipantsBtn').addClass('nodisplay');
        $('#removeParticipantsSubmitBtn').removeClass('nodisplay');
        $('#addParticipantsBtn').addClass('invisible');
      }
    }
    countDisplay.attr('value', newValue);
    countDisplay.html('<span class="d-inline-flex">'+newValue+ '<span class="mobileNone mx-1">participants</span> to be removed'+'</span>');
    status.html('<i class="fas fa-minus"></i>');
    $('#removedParticipantsDisplay').html(
      $('#removedParticipantsDisplay').html() + removedParticipantsDisplay_template(profilePic, sex)
    );
    if($('#removedParticipantsDisplay').attr('value') == ''){
      $('#removedParticipantsDisplay').attr('value', id);
    } else{
      $('#removedParticipantsDisplay').attr('value', $('#removedParticipantsDisplay').attr('value') +','+id);
    }
  } else if(status.html() == '<i class="fas fa-minus"></i>'){
    let newValue = Number(countDisplay.attr('value')) - 1;
    if(newValue == 0){
      if($('#removeParticipantsBtn').hasClass('nodisplay')){
        $('#removeParticipantsBtn').removeClass('nodisplay');
        $('#removeParticipantsSubmitBtn').addClass('nodisplay');
        $('#addParticipantsBtn').removeClass('invisible');
        $('#matchDisplayRemove').html('');
        $('#participantsSearch').addClass('nodisplay');
      }
    }
    countDisplay.attr('value', newValue);
    countDisplay.html('<span class="d-flex">'+newValue+ '<span class="mobileNone mx-1">participants</span> to be removed'+'</span>');
    status.html('<i class="fas fa-plus"></i>');
    $('#removedParticipantsDisplay').html(
      $('#removedParticipantsDisplay').html().replace(removedParticipantsDisplay_template(profilePic, sex), '')
    );
    let newArr = $('#removedParticipantsDisplay').attr('value').split(',').filter(val => val !== id);
    $('#removedParticipantsDisplay').attr('value', newArr);
  }
});

$('#removeParticipantsSubmitBtn').on('click', function(){
  const oldParticipantsToBeRemoved = $('#removedParticipantsDisplay').attr('value').split(',');
  const csrfToken = $(this).attr('csrf-token');
  const roomId = $('#roomName').attr('value');
  const clubId = $('#clubName').attr('value');
  $(`<form action="/clubs/${clubId}/rooms/${roomId}/edit?_method=PUT" method="POST">
    <input type="hidden" name="removeParticipants" value="${oldParticipantsToBeRemoved}">
    <input type="hidden" name="_csrf" value="${csrfToken}">
  </form>`).appendTo('body').submit();
});

function showParticipantMatches_template(matches, roomParticipantsList, toBeRemovedParticipants, currentUserId){
  html = ejs.render(`
  <% if(matches.length > 0){ %>
    <% for(var i=0;i<matches.length;i++){ %>
      <% if(roomParticipantsList.includes(matches[i]._id)){ %>
        <% if(matches[i]._id == currentUserId){ %>
          <div id="participantId<%= matches[i]._id %>" class="participantElem card card-body3 mb-1 pointer" 
          profilePic="<%= matches[i].profilePic %>" sex="<%= matches[i].userKeys.sex %>" style="border: 1px dashed #f15e5e;">
        <% } else{ %>
          <div id="participantId<%= matches[i]._id %>" class="participantElem card card-body3 mb-1 pointer" 
          profilePic="<%= matches[i].profilePic %>" sex="<%= matches[i].userKeys.sex %>">
        <% } %>
          <div class="px-2 py-1">
            <div class="d-flex flex-row">
              <% if(toBeRemovedParticipants.includes(matches[i]._id)){ %>
                <div id="participantStatus<%= matches[i]._id %>" class="my-auto grey"><i class="fas fa-minus"></i></div>
              <% } else{ %>
                <div id="participantStatus<%= matches[i]._id %>" class="my-auto grey"><i class="fas fa-plus"></i></div>
              <% } %>
              <div class="mx-3">
                <% if(matches[i].userKeys.sex == 'Male'){ %>
                  <img class="navdp rounded-circle" src="<%= matches[i].profilePic || '/images/noUserMale.png' %>">
                <% } else if(matches[i].userKeys.sex == 'Female'){ %>
                  <img class="navdp rounded-circle" src="<%= matches[i].profilePic || '/images/noUserFemale.png' %>">
                <% } %>
              </div>
              <div class="my-auto fullwidth">
                <div class="valign">
                  <div class="grey">
                    <span class="grey mobiletext">
                      <strong><%= matches[i].fullName %></strong>
                      <% if(matches[i].userKeys.batch){ %>
                        , <%= matches[i].userKeys.batch %>
                      <% } %>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      <% } %>
    <% } %>
  <% } %>
`, {matches, roomParticipantsList, toBeRemovedParticipants, currentUserId});
  return html;
}

function removedParticipantsDisplay_template(profilePic, sex){
  html = ejs.render(`
  <% if(sex == 'Male'){ %>
    <img class="navdp rounded-circle mr-2" src="<%= profilePic || '/images/noUserMale.png' %>">
  <% } else if(sex == 'Female'){ %>
    <img class="navdp rounded-circle" src="<%= profilePic || '/images/noUserFemale.png' %>">
  <% } %>
`, {profilePic, sex});
  return html;
}