/* When the user scrolls down, hide the navbar. When the user scrolls up, show the navbar */
var prevScrollpos = window.pageYOffset;
window.onscroll = function(){
  var currentScrollPos = window.pageYOffset;
  var navbar = document.getElementById("navbar");
  var pop_box_requests = document.getElementById("pop_box_requests");
  var pop_box_notifications = document.getElementById("pop_box_notifications");
  var discover_nav = document.getElementById("discover_nav");
  var scroll = document.documentElement.scrollTop;

  if($(window).width() > 1199 && prevScrollpos > currentScrollPos) {
    navbar.style.top = "0";
    pop_box_requests.style.top = "40px";
    pop_box_notifications.style.top = "40px";
  } else if($(window).width() < 1199 && prevScrollpos > currentScrollPos){
    navbar.style.top = "0px";
    pop_box_requests.style.top = "42px";
    pop_box_notifications.style.top = "42px";
  } else if($(window).width() > 1199 && prevScrollpos < currentScrollPos && currentScrollPos > 42){
    navbar.style.top = "-40px";
    pop_box_requests.style.top = "-600px";
    pop_box_notifications.style.top = "-600px";
  } else if($(window).width() < 1200 && prevScrollpos < currentScrollPos && currentScrollPos > 0){
    navbar.style.top = "-50px";
    pop_box_requests.style.top = "-600px";
    pop_box_notifications.style.top = "-600px";
  }
  prevScrollpos = currentScrollPos;

  if(discover_nav){
    if(scroll > 40){
      discover_nav.classList.add("nav-hidden");
    } else{
      discover_nav.classList.remove("nav-hidden");
    }
  }
}

//Sidebar dropdown
var dropdown = document.getElementsByClassName('dropdown-sidebar');
for (var i=0;i<dropdown.length;i++){
  dropdown[i].addEventListener('click', function(){
    this.classList.toggle('active');
    if(location.pathname == '/home'){
      var home = document.getElementById('side-home');
      home.classList.toggle('active');
    } else if(location.pathname == '/discover'){
      var discover = document.getElementById('side-discover');
      discover.classList.toggle('active');
    } else if(location.pathname == '/friends_posts'){
      var friends = document.getElementById('side-friends');
      friends.classList.toggle('active');
    }
    var drop = document.getElementById('side-drop');
    var club = document.getElementById('club-door');
    if(this.classList.contains('active')){
      drop.innerHTML = '<i class="fa fa-caret-up"></i>';
      club.innerHTML = '<i class="fas fa-door-open"></i> Clubs';
    } else{
      drop.innerHTML = '<i class="fa fa-caret-down"></i>';
      club.innerHTML = '<i class="fas fa-door-closed"></i> Clubs';
    }
    var dropdownContent = document.getElementById('sidebar-dropbox');
    if (dropdownContent.style.display == 'block'){
      dropdownContent.style.display = 'none';
    } else {
      dropdownContent.style.display = 'block';
    }
  });
}

if(location.pathname == '/home'){
  var home = document.getElementById('side-home');
  home.classList.toggle('active');
} else if(location.pathname == '/discover'){
  var discover = document.getElementById('side-discover');
  discover.classList.toggle('active');
} else if(location.pathname == '/friends_posts'){
  var friends = document.getElementById('side-friends');
  friends.classList.toggle('active');
}

if(location.pathname.split('/').length == 3 && location.pathname.split('/')[1] == 'clubs' && 
  location.pathname.split('/')[2].match(/^[a-fA-F0-9]{24}$/)){
  // Latest message mobile
  if($(window).width() < 768){
    $('#drop-chat').on('click', function(e){
      $('#latestMsg').toggleClass("nodisplay");
      $('#latestMsg-hidden').toggleClass("nodisplay");
    });
  }
  // Ask for club invite
  if(!$('#memberReq-btn').length && $('#cancelReq-btn').length){
    $('#memberReq-div').addClass("nodisplay");
  }
  if($(window).width() < 360){
    $('#requests-tab').text('Req');
  }
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
}

// Fake Progress bar (Nanobar)
var options = {
  classname: 'meter',
    id: 'bar-id'
};
var nanobar = new Nanobar( options );
nanobar.go(30);
nanobar.go(76);
nanobar.go(100);

// Hide sidebar
function hidesidebar(){
  var sidebar = document.getElementById('sidebar');
  var content = document.getElementById('content');
  if(sidebar.style.display == 'block' || sidebar.style.display != 'none'){
    sidebar.style.display = 'none';
    content.style.marginLeft = '0';
  }
  else{
    sidebar.style.display = 'block';
    content.style.marginLeft = '10rem';
  }
}

$('#input_topic').on('input', function(e){
  if($(this).val() != ''){
    $('#priv_everyone').removeAttr('selected');
    $('#priv_club').attr('selected', 'true');
    $('.priv_public').attr('disabled', 'true');
  } else{
    $('.priv_public').removeAttr('disabled');
    $('#priv_club').removeAttr('selected');
    $('#priv_everyone').attr('selected', 'true');
  }
});

$('#inputPassword').on('input', function(e){
  if($(this).val() != ''){
    $('#pass_show').css('display','block');
  } else{
    $('#pass_show').css('display','none');
  }
  var pass = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!$%@#£€*+/.()?& -]{6,18}$/;
  if($(this).val().match(pass)){
    $('#pass_info').css('display','none');
  } else{
    $('#pass_info').css('display','block');
  }
});

// Manual club invite
$(function(){
  if($('div').hasClass('clubInvite-select') && adminClubs.length!=0){
    var myDiv = document.getElementById('clubInvite-select');
    var clubs = adminClubs;
    var user = invitedUser;
    var selectList = document.createElement('select');
    selectList.setAttribute('name', 'clubId');
    selectList.classList.add('select2');
    selectList.setAttribute('onchange', 'this.form.submit()');
    myDiv.appendChild(selectList);
    //Create and append the options
    var option = document.createElement('option');
    option.setAttribute('value', '#');
    option.setAttribute('selected', 'true');
    option.setAttribute('disabled', 'disabled');
    option.text = 'Invite to..';
    selectList.appendChild(option);
    for (var i = 0; i < clubs.length; i++){
      var option = document.createElement('option');
      option.setAttribute('value', clubs[i]._id+','+user);
      option.text = clubs[i].name;
      option.classList.add('blackcolor');
      selectList.appendChild(option);
    }
  }
});
// Cancel club invite
$(function(){
  if($('div').hasClass('inviteCancel-select') && clubInvites.length!=0){
    var myDiv = document.getElementById('inviteCancel-select');
    var user = invitedUser;
    var invites = clubInvites;
    var selectList = document.createElement('select');
    selectList.setAttribute('name', 'cancelClubId');
    selectList.classList.add('select3','redcolor-border');
    selectList.setAttribute('onchange', 'this.form.submit()');
    myDiv.appendChild(selectList);
    var option = document.createElement('option');
    option.setAttribute('value', '#');
    option.setAttribute('selected', 'true');
    option.setAttribute('disabled', 'disabled');
    option.text = 'Cancel invitation';
    selectList.appendChild(option);
    for (var i = 0; i < invites.length; i++){
      var option = document.createElement('option');
      option.setAttribute('value', invites[i]._id+','+user);
      option.text = invites[i].name;
      option.classList.add('blackcolor');
      selectList.appendChild(option);
    }
  }
});

// Add loading spinner
function loading_spinner(targetId, checkId){
  var targetIdVar = '#'+targetId; var checkIdVar = '#'+checkId;
  if(checkId == '' || (checkId != '' && $(checkIdVar).val() != '')){
    $(targetIdVar).addClass("spinner-border spinner-border-sm mr-1");
  }
}

// Togle requests navlink active state
function toggle_requests(id){
  var divelement = document.getElementById(id);
  divelement.classList.toggle('requests-active');
}

//Toggle element display
function toggle_inline_display(id){
  var divelement = document.getElementById(id);
  if(divelement.style.display == 'inline-block')
    divelement.style.display = 'none';
  else
    divelement.style.display = 'inline-block';
}

function toggle_display(id){
  var divelement = document.getElementById(id);
  if(divelement.style.display == 'block')
    divelement.style.display = 'none';
  else
    divelement.style.display = 'block';
}

function closeForm(id){
  document.getElementById(id).style.display = "none";
}

function toggleclass_display(id){
  var x = document.getElementsByClassName(id);
	var i;
	for (i = 0; i < x.length; i++){
		if(x[i].style.display == 'block')
      x[i].style.display = 'none';
    else
      x[i].style.display = 'block';
	}
}
//Block element display
function block_display(id){
    var x = document.getElementsByClassName(id);
	var i;
	for (i = 0; i < x.length; i++){
		x[i].style.display = 'block';
	}
}
//None element display
function none_display(id){
    var x = document.getElementsByClassName(id);
	var i;
	for (i = 0; i < x.length; i++){
		x[i].style.display = 'none';
	}
}

function favourites_add(id,name,placeholder){
  var divelement = document.getElementById(id);
  var input = document.createElement('input');
  input.setAttribute('type', 'text');
  input.classList.add('form-control','form-control-sm', 'info-form');
  input.setAttribute('name', name);
  input.setAttribute('placeholder', placeholder);
  divelement.appendChild(input);
}

function clear_text(){
	var divelement = document.getElementById('commentbox');
	divelement.value = '';
}

function clear_subpost(){
  var divelement = document.getElementById('subpostbox');
  divelement.value = '';
}

function showpw(){
  var x = document.getElementById('inputPassword');
  if (x.type === 'password'){
    x.type = 'text';
  } else{
    x.type = 'password';
  }
}

$('div#paginate-go-to').on('click', '#page-index-button2', function(e){
  e.preventDefault();
  var value = Math.abs($('#page-index-input2').val());
  var url = $('#page-index-input2').attr('href'); 
  window.location.href = url+value;
});

//Truncate
String.prototype.trunc = String.prototype.trunc ||
function(n){
  return (this.length > n) ? this.substr(0, n-1) + '...' : this;
}

// FEATURED Images
$('#featuredImage0').change(function(){
  var i = $(this).prev('label').clone();
  var file = $('#featuredImage0')[0].files[0].name;
  var truncated = file.trunc(15);
  $(this).prev('label').text(truncated);
});
$('#featuredImage1').change(function(){
  var i = $(this).prev('label').clone();
  var file = $('#featuredImage1')[0].files[0].name;
  var truncated = file.trunc(15);
  $(this).prev('label').text(truncated);
});
$('#featuredImage2').change(function(){
  var i = $(this).prev('label').clone();
  var file = $('#featuredImage2')[0].files[0].name;
  var truncated = file.trunc(15);
  $(this).prev('label').text(truncated);
});
$('#featuredImage3').change(function(){
  var i = $(this).prev('label').clone();
  var file = $('#featuredImage3')[0].files[0].name;
  var truncated = file.trunc(15);
  $(this).prev('label').text(truncated);
});
$('#featuredImage4').change(function(){
  var i = $(this).prev('label').clone();
  var file = $('#featuredImage4')[0].files[0].name;
  var truncated = file.trunc(15);
  $(this).prev('label').text(truncated);
});

// Label path for input image file
$('#inputImage').change(function(){
	var i = $(this).prev('label').clone();
	var file = $('#inputImage')[0].files[0].name;
	var truncated = file.trunc(15);
	$(this).prev('label').text(truncated);
});
$('#inputprofilePic').change(function(){
	var i = $(this).prev('label').clone();
	var file = $('#inputprofilePic')[0].files[0].name;
	var truncated = file.trunc(15);
	$(this).prev('label').text(truncated);
	$('.overlay2').css('display','block');
});
$('#inputavatar').change(function(){
	var i = $(this).prev('label').clone();
	var file = $('#inputavatar')[0].files[0].name;
	var truncated = file.trunc(15);
	$(this).prev('label').text(truncated);
	$('.overlay2').css('display','block');
});

// Privacy select button
function focus() {
  [].forEach.call(this.options, function(option){
    var valueId = option.getAttribute('value').split(',');
    option.textContent = valueId[0] + ' (' + option.getAttribute('data-descr') + ')';
  });
}
function blur() {
  [].forEach.call(this.options, function(option){
    var valueId = option.getAttribute('value').split(',');
    option.textContent = valueId[0];
  });
}
[].forEach.call(document.querySelectorAll('.shortened-select'), function(select){
  select.addEventListener('focus', focus);
  select.addEventListener('blur', blur);
  blur.call(select);
});

// System emoji picker
$(document).on("click","#emoji-picker",function (e){
  e.stopPropagation();
  $('.intercom-composer-emoji-popover').addClass("active");
});
$(document).click(function (e){
  if ($(e.target).attr('class') != '.intercom-composer-emoji-popover' && $(e.target).parents(".intercom-composer-emoji-popover").length == 0) {
    $(".intercom-composer-emoji-popover").removeClass("active");
  }
});
$(document).on("click",".intercom-emoji-picker-emoji", function(e){
  var target = $('.emoji-input');
  var caretPos = document.getElementsByClassName('emoji-input')[0].selectionStart;
  var caretEnd = document.getElementsByClassName('emoji-input')[0].selectionEnd;
  var textAreaTxt = target.val();
  var txtToAdd = $(this).html();
  target.val(textAreaTxt.substring(0, caretPos) + txtToAdd + textAreaTxt.substring( caretEnd )).focus();
  document.getElementsByClassName('emoji-input')[0].selectionStart = caretPos + txtToAdd.length;
  document.getElementsByClassName('emoji-input')[0].selectionEnd = caretPos + txtToAdd.length;
});
$('.intercom-composer-popover-input').on('input', function() {
  var query = this.value;
  if(query != ""){
    $(".intercom-emoji-picker-emoji:not([title*='"+query+"'])").hide();
  }
  else{
    $(".intercom-emoji-picker-emoji").show();
  }
});

////////////////// System emoji picker2 //////////////////
$(document).on("click","#emoji-picker2",function(e){
  e.stopPropagation();
  $('.intercom-composer-emoji-popover2').addClass("active");
});
$(document).click(function (e) {
  if ($(e.target).attr('class') != '.intercom-composer-emoji-popover2' && $(e.target).parents(".intercom-composer-emoji-popover2").length == 0) {
    $(".intercom-composer-emoji-popover2").removeClass("active");
  }
});
$(document).on("click",".intercom-emoji-picker-emoji2",function(e){
  var target = $('.emoji-input2');
  var caretPos = document.getElementsByClassName('emoji-input2')[0].selectionStart;
  var caretEnd = document.getElementsByClassName('emoji-input2')[0].selectionEnd;
  var textAreaTxt = target.val();
  var txtToAdd = $(this).html();
  target.val(textAreaTxt.substring(0, caretPos) + txtToAdd + textAreaTxt.substring( caretEnd )).focus();
  document.getElementsByClassName('emoji-input2')[0].selectionStart = caretPos + txtToAdd.length;
  document.getElementsByClassName('emoji-input2')[0].selectionEnd = caretPos + txtToAdd.length;
});
$('.intercom-composer-popover-input2').on('input', function() {
  var query = this.value;
  if(query != ""){
    $(".intercom-emoji-picker-emoji2:not([title*='"+query+"'])").hide();
  }
  else{
    $(".intercom-emoji-picker-emoji2").show();
  }
});

$(function (){
  $('#datetimepicker4').datetimepicker({format: 'L'});
  setTimeout(function(){
    var divUtc = $('#timeUTC');
    var divLocal = $('#timeLocal');
    var divUtcNow = $('#timeUTCNow');
    var divLocalNow = $('#timeLocalNow');
    
    //get text from timeUTC and conver to local timezone  
    var localTime  = moment.utc(divUtc.text()).toDate();
    localTime = moment(localTime).format('lll');
    divLocal.text(localTime);
    var localTimeNow  = moment.utc(divUtcNow.text()).toDate();
    localTimeNow = moment(localTimeNow).format('LT');
    divLocalNow.text(localTimeNow);
  }, 1000);
});

if(location.pathname == '/help/'){
  $(".navhelp").addClass('requests-active');
}

// Copy college name
function copyTxtFn() {
  var range, selection, worked;
  var copyText = document.getElementById('copyTxt');
  if (document.body.createTextRange) {
    range = document.body.createTextRange();
    range.moveToElementText(copyText);
    range.select();
  } else if (window.getSelection) {
    selection = window.getSelection();        
    range = document.createRange();
    range.selectNodeContents(copyText);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  try {
    document.execCommand('copy');
    var tooltip = document.getElementById("myTooltip");
    tooltip.innerHTML = "Copied: " + $('#copyTxt').text();
  }
  catch (err) {
    alert('unable to copy text');
  }
}

function outCopyTxtFn() {
  var tooltip = document.getElementById("myTooltip");
  tooltip.innerHTML = "Copy to clipboard";
}

$('#fcomments-btn').on('click', function(){
  console.log('CLICK');
  $('#commentbox').focus().click();
});

//================================================================================
// AJAX
//================================================================================
// Expensive event delegation?
$("div#delegated-posts").on('click', '.vote', function(e){
  e.preventDefault();
  e.stopImmediatePropagation();
  var formData = $(this).closest('form').serializeArray();
  formData.push({ name: this.name, value: this.value });
  //now use formData, it includes the submit button
  var formAction = $(this).closest('form').attr('action');
  $.ajax({
    url: formAction,
    timeout: 3000,
    data: formData,
    type: 'PUT',
    success: function(data){
      // Process the expected results...
      $('#like-count'+data._id).text(data.likeCount);
      $('#dislike-count'+data._id).text(data.dislikeCount);
      $('#heart-count'+data._id).text(data.heartCount);

      if(formData[0].name == 'like'){
        if($('#like-btn'+data._id).html() == '<i class="fas fa-thumbs-up greencolor"></i>'){
          $('#like-btn'+data._id).html('<i class="far fa-thumbs-up"></i>');
        }
        else if($('#like-btn'+data._id).html() == '<i class="far fa-thumbs-up"></i>'
        || $('#dislike-btn'+data._id).html('<i class="fas fa-thumbs-down blackcolor"></i>')
        || $('#heart-btn'+data._id).html() == '<i class="fas fa-heart redcolor"></i>'){
          $('#like-btn'+data._id).html('<i class="fas fa-thumbs-up greencolor"></i>');
          $('#dislike-btn'+data._id).html('<i class="far fa-thumbs-down"></i>');
          $('#heart-btn'+data._id).html('<i class="far fa-heart"></i>');
        }
        $('#like-count'+data._id).toggleClass('greencolor');
        $('#dislike-count'+data._id).removeClass('blackcolor');
        $('#heart-count'+data._id).removeClass('redcolor');
      }
      if(formData[0].name == 'dislike'){
        if($('#dislike-btn'+data._id).html() == '<i class="fas fa-thumbs-down blackcolor"></i>'){
          $('#dislike-btn'+data._id).html('<i class="far fa-thumbs-down"></i>');
        }
        else if($('#dislike-btn'+data._id).html() == '<i class="far fa-thumbs-down"></i>'
        || $('#like-btn'+data._id).html('<i class="fas fa-thumbs-up greencolor"></i>')
        || $('#heart-btn'+data._id).html() == '<i class="fas fa-heart redcolor"></i>'){
          $('#dislike-btn'+data._id).html('<i class="fas fa-thumbs-down blackcolor"></i>');
          $('#like-btn'+data._id).html('<i class="far fa-thumbs-up"></i>');
          $('#heart-btn'+data._id).html('<i class="far fa-heart"></i>');
        }
        $('#like-count'+data._id).removeClass('greencolor');
        $('#dislike-count'+data._id).toggleClass('blackcolor');
        $('#heart-count'+data._id).removeClass('redcolor');
      }
      if(formData[0].name == 'heart'){
        if($('#heart-btn'+data._id).html() == '<i class="fas fa-heart redcolor"></i>'){
          $('#heart-btn'+data._id).html('<i class="far fa-heart"></i>');
        }
        else if($('#heart-btn'+data._id).html() == '<i class="far fa-heart"></i>'
        || $('#dislike-btn'+data._id).html('<i class="fas fa-thumbs-down blackcolor"></i>')
        || $('#like-btn'+data._id).html() == '<i class="fas fa-thumbs-up greencolor"></i>'){
          $('#heart-btn'+data._id).html('<i class="fas fa-heart redcolor"></i>');
          $('#dislike-btn'+data._id).html('<i class="far fa-thumbs-down"></i>');
          $('#like-btn'+data._id).html('<i class="far fa-thumbs-up"></i>');
        }
        $('#like-count'+data._id).removeClass('greencolor');
        $('#dislike-count'+data._id).removeClass('blackcolor');
        $('#heart-count'+data._id).toggleClass('redcolor');
      }
    },
    error: function(xhr) {
      if(xhr.status == 404){
        alert("Please Login first");
        location = "/login";
      } else{alert("Error "+xhr.status+": "+ xhr.statusText);}
    }
  })
});

$("div#delegated-posts").on('click', '.moderation', function(e){
  e.preventDefault();
  e.stopImmediatePropagation();
  var formData = $(this).closest('form').serializeArray();
  formData.push({ name: this.name, value: this.value });
  var formAction = $(this).closest('form').attr('action');
  $.ajax({
    url: formAction,
    timeout: 3000,
    data: formData,
    type: 'PUT',
    success: function(data){
      if(formData[0].name == 'published'){
        $('#moderation'+data._id).removeClass('btn-light').addClass('btn-info').text('Published')
        .attr('name','exclusive').attr('value',1);
        $('#mod-badge'+data._id).text('0');
      }
      if(formData[0].name == 'exclusive'){
        $('#moderation'+data._id).removeClass('btn-info').addClass('btn-light').text('Exclusive')
        .attr('name','published').attr('value',0);
        $('#mod-badge'+data._id).text('1');
      }
      if(formData[0].name == 'visibility'){
        if(formData[0].value == '-1'){
          $('#moderation'+data._id).remove();
          $('#modVisibility'+data._id).removeClass('createdButton');
          $('#mod-badge'+data._id).removeClass('badge-light').addClass('badge-danger').text('-1');
          $('#visibility'+data._id).text('Visibility(Show)').val('1');
        } else if(formData[0].value == '1'){
          $('#visibility'+data._id).text('Visibility(Hide)').val('-1');
          $('#mod-badge'+data._id).removeClass('badge-danger').addClass('badge-light').text('1');
          var mySpan = document.getElementById('modVisibility'+data._id);
            if(!$('#modVisibility'+data._id).hasClass('createdButton')){
              var btnVisibility = document.createElement('button');
              btnVisibility.setAttribute('id', 'moderation'+data._id);
              btnVisibility.classList.add('moderation','btn','btnxxs','btn-light','noshadow','text-sm','ml-2');
              btnVisibility.setAttribute('name', 'published');
              btnVisibility.setAttribute('value', '0');
              btnVisibility.setAttribute('title', 'Post moderation');
              btnVisibility.setAttribute('type', 'submit');
              btnVisibility.innerHTML = 'Exclusive';
              mySpan.appendChild(btnVisibility);
            }
          $('#modVisibility'+data._id).removeClass('nodisplay').addClass('nopad').addClass('createdButton');
        }
      }
    },
    error: function(xhr) {
      if(xhr.status == 404){
        alert("Please Login first");
        alert("Error "+xhr.status+": "+ xhr.statusText);
      }
    }
  })
});

$("div#delegated-posts").on('click', '.modvote', function(e){
  e.preventDefault();
  e.stopImmediatePropagation();
  var formData = $(this).closest('form').serializeArray();
  formData.push({ name: this.name, value: this.value });
  var formAction = $(this).closest('form').attr('action');
  $.ajax({
    url: formAction,
    timeout: 3000,
    data: formData,
    type: 'PUT',
    success: function(data){
      $('#modVote-count'+data._id).text(data.upVoteCount - data.downVoteCount);

      if(formData[0].name == 'upVote'){
        $('#upVote-btn'+data._id).toggleClass('bluecolor');
        if($('#modVote-count'+data._id).hasClass('bluecolor')){
          $('#modVote-count'+data._id).removeClass('bluecolor');
        } else{
          $('#modVote-count'+data._id).removeClass('darkgrey').removeClass('orangecolor').addClass('bluecolor');
        }
        $('#downVote-btn'+data._id).removeClass('orangecolor');
      }
      if(formData[0].name == 'downVote'){
        $('#downVote-btn'+data._id).toggleClass('orangecolor');
        if($('#modVote-count'+data._id).hasClass('orangecolor')){
          $('#modVote-count'+data._id).removeClass('orangecolor');
        } else{
          $('#modVote-count'+data._id).removeClass('darkgrey').removeClass('bluecolor').addClass('orangecolor');
        }
        $('#upVote-btn'+data._id).removeClass('bluecolor');
      }
    },
    error: function(xhr) {
      if(xhr.status == 404){
        alert("Please Login first");
        location = "/login";
      } else{alert("Error "+xhr.status+": "+ xhr.statusText);}
    }
  })
});

////////////////// HEART POSTS ////////////////////
$('div#delegated-heart-posts').on('click', '.vote', function(e){
  e.preventDefault();
  e.stopImmediatePropagation();
  var formData = $(this).closest('form').serializeArray();
  formData.push({ name: this.name, value: this.value });
  var formAction = $(this).closest('form').attr('action');
  $.ajax({
    url: formAction,
    timeout: 3000,
    data: formData,
    type: 'PUT',
    success: function(data){
      // Process the expected results...
      $('#like-countH'+data._id).text(data.likeCount);
      $('#dislike-countH'+data._id).text(data.dislikeCount);
      $('#heart-countH'+data._id).text(data.heartCount);

      if(formData[0].name == 'like'){
        if($('#like-btnH'+data._id).html() == '<i class="fas fa-thumbs-up greencolor"></i>'){
          $('#like-btnH'+data._id).html('<i class="far fa-thumbs-up"></i>');
        }
        else if($('#like-btnH'+data._id).html() == '<i class="far fa-thumbs-up"></i>'
        || $('#dislike-btnH'+data._id).html('<i class="fas fa-thumbs-down blackcolor"></i>')
        || $('#heart-btnH'+data._id).html() == '<i class="fas fa-heart redcolor"></i>'){
          $('#like-btnH'+data._id).html('<i class="fas fa-thumbs-up greencolor"></i>');
          $('#dislike-btnH'+data._id).html('<i class="far fa-thumbs-down"></i>');
          $('#heart-btnH'+data._id).html('<i class="far fa-heart"></i>');
        }
        $('#like-countH'+data._id).toggleClass('greencolor');
        $('#dislike-countH'+data._id).removeClass('blackcolor');
        $('#heart-countH'+data._id).removeClass('redcolor');
      }
      if(formData[0].name == 'dislike'){
        if($('#dislike-btnH'+data._id).html() == '<i class="fas fa-thumbs-down blackcolor"></i>'){
          $('#dislike-btnH'+data._id).html('<i class="far fa-thumbs-down"></i>');
        }
        else if($('#dislike-btnH'+data._id).html() == '<i class="far fa-thumbs-down"></i>'
        || $('#like-btnH'+data._id).html('<i class="fas fa-thumbs-up greencolor"></i>')
        || $('#heart-btnH'+data._id).html() == '<i class="fas fa-heart redcolor"></i>'){
          $('#dislike-btnH'+data._id).html('<i class="fas fa-thumbs-down blackcolor"></i>');
          $('#like-btnH'+data._id).html('<i class="far fa-thumbs-up"></i>');
          $('#heart-btnH'+data._id).html('<i class="far fa-heart"></i>');
        }
        $('#like-countH'+data._id).removeClass('greencolor');
        $('#dislike-countH'+data._id).toggleClass('blackcolor');
        $('#heart-countH'+data._id).removeClass('redcolor');
      }
      if(formData[0].name == 'heart'){
        if($('#heart-btnH'+data._id).html() == '<i class="fas fa-heart redcolor"></i>'){
          $('#heart-btnH'+data._id).html('<i class="far fa-heart"></i>');
        }
        else if($('#heart-btnH'+data._id).html() == '<i class="far fa-heart"></i>'
        || $('#dislike-btnH'+data._id).html('<i class="fas fa-thumbs-down blackcolor"></i>')
        || $('#like-btnH'+data._id).html() == '<i class="fas fa-thumbs-up greencolor"></i>'){
          $('#heart-btnH'+data._id).html('<i class="fas fa-heart redcolor"></i>');
          $('#dislike-btnH'+data._id).html('<i class="far fa-thumbs-down"></i>');
          $('#like-btnH'+data._id).html('<i class="far fa-thumbs-up"></i>');
        }
        $('#like-countH'+data._id).removeClass('greencolor');
        $('#dislike-countH'+data._id).removeClass('blackcolor');
        $('#heart-countH'+data._id).toggleClass('redcolor');
      }
    },
    error: function(xhr) {
      if(xhr.status == 404){
        alert("Please Login first");
        location = "/login";
      } else{alert("Error "+xhr.status+": "+ xhr.statusText);}
    }
  })
});

$('div#delegated-heart-posts').on('click', '.modvote', function(e){
  e.preventDefault();
  e.stopImmediatePropagation();
  var formData = $(this).closest('form').serializeArray();
  formData.push({ name: this.name, value: this.value });
  var formAction = $(this).closest('form').attr('action');
  $.ajax({
    url: formAction,
    timeout: 3000,
    data: formData,
    type: 'PUT',
    success: function(data){
      $('#modVote-countH'+data._id).text(data.upVoteCount - data.downVoteCount);

      if(formData[0].name == 'upVote'){
        $('#upVote-btnH'+data._id).toggleClass('bluecolor');
        if($('#modVote-countH'+data._id).hasClass('bluecolor')){
          $('#modVote-countH'+data._id).removeClass('bluecolor');
        } else{
          $('#modVote-countH'+data._id).removeClass('darkgrey').removeClass('orangecolor').addClass('bluecolor');
        }
        $('#downVote-btnH'+data._id).removeClass('orangecolor');
      }
      if(formData[0].name == 'downVote'){
        $('#downVote-btnH'+data._id).toggleClass('orangecolor');
        if($('#modVote-countH'+data._id).hasClass('orangecolor')){
          $('#modVote-countH'+data._id).removeClass('orangecolor');
        } else{
          $('#modVote-countH'+data._id).removeClass('darkgrey').removeClass('bluecolor').addClass('orangecolor');
        }
        $('#upVote-btnH'+data._id).removeClass('bluecolor');
      }
    },
    error: function(xhr) {
      if(xhr.status == 404){
        alert("Please Login first");
        location = "/login";
      } else{alert("Error "+xhr.status+": "+ xhr.statusText);}
    }
  })
});
///////////////////////////////////////////////////

$('div#delegated-comments').on('click', '.commentvote', function(e){
  e.preventDefault();
  e.stopImmediatePropagation();
  var formData = $(this).closest('form').serializeArray();
  formData.push({ name: this.name, value: this.value });
  var formAction = $(this).closest('form').attr('action');
  $.ajax({
    url: formAction,
    timeout: 3000,
    data: formData,
    type: 'PUT',
    success: function(data){
      $('#comment-up-count'+data.comments[0]._id).text(data.comments[0].upvotesCount);

      if(formData[0].name == 'commentUp'){
        $('#comment-up-btn'+data.comments[0]._id).toggleClass('greencolor');
        $('#comment-up-count'+data.comments[0]._id).toggleClass('greencolor');
      }
    },
    error: function(xhr) {
      if(xhr.status == 404){
        alert("Please Login first");
        location = "/login";
      } else{alert("Error "+xhr.status+": "+ xhr.statusText);}
    }
  })
});

$('div#dynamic-subPosts').on('click', '.vote2', function(e){
  e.preventDefault();
  e.stopImmediatePropagation();
  var formData = $(this).closest('form').serializeArray();
  formData.push({ name: this.name, value: this.value });
  var formAction = $(this).closest('form').attr('action');
  $.ajax({
    url: formAction,
    timeout: 3000,
    data: formData,
    type: 'PUT',
    success: function(data){
      $('#like-count'+data.subPosts[0]._id).text(data.subPosts[0].likeCount);
      $('#dislike-count'+data.subPosts[0]._id).text(data.subPosts[0].dislikeCount);

      if(formData[0].name == 'subLike'){
        if($('#like-btn'+data.subPosts[0]._id).html() == '<i class="fas fa-thumbs-up greencolor"></i>'){
          $('#like-btn'+data.subPosts[0]._id).html('<i class="far fa-thumbs-up"></i>');
        }
        else if($('#like-btn'+data.subPosts[0]._id).html() == '<i class="far fa-thumbs-up"></i>'
        || $('#dislike-btn'+data.subPosts[0]._id).html('<i class="fas fa-thumbs-down blackcolor"></i>')){
          $('#like-btn'+data.subPosts[0]._id).html('<i class="fas fa-thumbs-up greencolor"></i>');
          $('#dislike-btn'+data.subPosts[0]._id).html('<i class="far fa-thumbs-down"></i>');
        }
        $('#like-count'+data.subPosts[0]._id).toggleClass('greencolor');
        $('#dislike-count'+data.subPosts[0]._id).removeClass('blackcolor');
      }
      if(formData[0].name == 'subDislike'){
        if($('#dislike-btn'+data.subPosts[0]._id).html() == '<i class="fas fa-thumbs-down blackcolor"></i>'){
          $('#dislike-btn'+data.subPosts[0]._id).html('<i class="far fa-thumbs-down"></i>');
        }
        else if($('#dislike-btn'+data.subPosts[0]._id).html() == '<i class="far fa-thumbs-down"></i>'
        || $('#like-btn'+data.subPosts[0]._id).html('<i class="fas fa-thumbs-up greencolor"></i>')){
          $('#dislike-btn'+data.subPosts[0]._id).html('<i class="fas fa-thumbs-down blackcolor"></i>');
          $('#like-btn'+data.subPosts[0]._id).html('<i class="far fa-thumbs-up"></i>');
        }
        $('#like-count'+data.subPosts[0]._id).removeClass('greencolor');
        $('#dislike-count'+data.subPosts[0]._id).toggleClass('blackcolor');
      }
    },
    error: function(xhr) {
      if(xhr.status == 404){
        alert("Please Login first");
        location = "/login";
      } else{alert("Error "+xhr.status+": "+ xhr.statusText);}
    }
  })
});
