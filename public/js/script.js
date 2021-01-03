/* When the user scrolls down, hide the navbar. When the user scrolls up, show the navbar */
var prevScrollpos = window.pageYOffset;
window.onscroll = function(){
  var currentScrollPos = window.pageYOffset;
  var navbar = document.getElementById("navbar");
  var pop_box_requests = document.getElementById("pop_box_requests");
  var discover_nav = document.getElementById("discover_nav");
  var scroll = document.documentElement.scrollTop;

  if(window.innerWidth > 1199 && prevScrollpos > currentScrollPos){
    navbar.style.transform = "translateY(0)";
    pop_box_requests.style.transform = "translateY(0)";
  } else if(!navbar.classList.contains('stuck') && window.innerWidth < 1199 && prevScrollpos > currentScrollPos){
    navbar.style.transform = "translateY(0px)";
    pop_box_requests.style.transform = "translateY(0)";
  } else if(window.innerWidth > 1199 && prevScrollpos < currentScrollPos && currentScrollPos > 42){
    navbar.style.transform = "translateY(-40px)";
    pop_box_requests.style.transform = "translateY(-600px)";
  } else if(!navbar.classList.contains('stuck') && window.innerWidth < 1200 && prevScrollpos < currentScrollPos && currentScrollPos > 0){
    navbar.style.transform = "translateY(-50px)";
    pop_box_requests.style.transform = "translateY(-600px)";
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
      club.innerHTML = '<i class="fas fa-door-open sidebar-icon px-1"></i>';
    } else{
      drop.innerHTML = '<i class="fa fa-caret-down"></i>';
      club.innerHTML = '<i class="fas fa-door-closed sidebar-icon px-1"></i>';
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

$('#latestUpdates').on('shown.bs.collapse', function(){
  if($('#pushnew').hasClass('admin')){
    $('#latestUpdates').animate({scrollTop: 92}, 500);
  } else if($('#pushnew').hasClass('moderator')){
    $('#latestUpdates').animate({scrollTop: 50}, 500);
  }
})

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
function hidesidebar(hideValueNum){
  var sidebar = document.getElementById('sidebar');
  var content = document.getElementById('content');
  if(hideValueNum == 0){
    if(sidebar.style.display == 'block' || sidebar.style.display != 'none'){
      sidebar.style.display = 'none';
      content.style.marginLeft = '0';
    }
    else{
      sidebar.style.display = 'block';
      content.style.marginLeft = '10rem';
    }
  } else if(hideValueNum == 1){
    sidebar.style.display = 'block';
    content.style.marginLeft = '10rem';
  } else if(hideValueNum == -1){
    sidebar.style.display = 'none';
    content.style.marginLeft = '0';
  }
  if(sidebar.style.display === 'block'){
    $('.hamburger').removeClass('is-active');
  } else if(sidebar.style.display === 'none'){
    $('.hamburger').addClass('is-active');
  }
}

$('#input_topic').on('input', function(e){
  if(!$('#description').hasClass('junior')){
    if($(this).val() != ''){
      $('#priv_everyone').removeAttr('selected');
      $('#priv_club').attr('selected', 'true');
      $('.priv_public').attr('disabled', 'true');
    } else{
      $('.priv_public').removeAttr('disabled');
      $('#priv_club').removeAttr('selected');
      $('#priv_everyone').attr('selected', 'true');
    }
  } else{
    if($(this).val() != ''){
      $('#description').removeClass('description2');
      $('#description').removeAttr('readonly', 'true');
      $('#description').attr('required', 'true');
    } else{
      $('#description').addClass('description2');
      $('#description').attr('readonly', 'true');
      $('#description').removeAttr('required', 'true');
    }
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
	for (i=0;i<x.length;i++){
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
	for (i=0;i<x.length;i++){
		x[i].style.display = 'block';
	}
}
//None element display
function none_display(id){
  var x = document.getElementsByClassName(id);
	var i;
	for (i=0;i<x.length;i++){
		x[i].style.display = 'none';
	}
}

function recommends_add(id,name,placeholder){
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
$('#inputprofilePic2').change(function(){
  var i = $(this).prev('label').clone();
  var file = $('#inputprofilePic2')[0].files[0].name;
  var truncated = file.trunc(15);
  $(this).prev('label').text(truncated);
  $('.overlay2').css('display','block');
});
$('#inputavatar').change(function(){
	var i = $(this).prev('label').clone();
	var file = $('#inputavatar')[0].files[0].name;
	var truncated = file.trunc(15);
	$(this).prev('label').text(truncated);
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
    var divUtc2 = $('#timeUTC2');
    var divLocal2 = $('#timeLocal2');
    var divLocalRelative = $('#timeLocalRelative');
    
    //get text from timeUTC and convert to local timezone  
    var localTime = moment.utc(divUtc.text()).toDate();
    localTime = moment(localTime).format('LT');
    divLocal.text(localTime);

    var localTime2 = moment.utc(divUtc2.text()).toDate();
    localTime2 = moment(localTime2).format('LT');
    divLocal2.text(localTime2);

    var localTimeRelative = moment.utc(divUtc.text()).toDate();
    localTimeRelative = moment(localTimeRelative).fromNow();
    divLocalRelative.text(localTimeRelative);
  }, 500);

  var divUtc1 = document.getElementsByClassName('timeUTC1');
  var divLocal1 = document.getElementsByClassName('timeLocal1');
  var divUtc3 = document.getElementsByClassName('timeUTC3');
  var divLocal3 = document.getElementsByClassName('timeLocal3');
  var divUtc7 = document.getElementsByClassName('timeUTC7');
  var divLocal7 = document.getElementsByClassName('timeLocal7');
  var divUtc365 = document.getElementsByClassName('timeUTC365');
  var divLocal365 = document.getElementsByClassName('timeLocal365');

  for(var i=0;i<divUtc1.length;i++){
    var localTime = moment.utc($('#'+divUtc1[i].id).text()).toDate();
    localTime = moment(localTime).format('LT');
    $('#'+divLocal1[i].id).text(localTime);
  }
  for(var i=0;i<divUtc3.length;i++){
    var localTime = moment.utc($('#'+divUtc3[i].id).text()).toDate();
    localTime = moment(localTime).fromNow();
    if(localTime.endsWith(' ago')){
      localTimeAdjusted = localTime.substring(0, localTime.length - 4);
      $('#'+divLocal3[i].id).text(localTimeAdjusted);
    } else{
      $('#'+divLocal3[i].id).text(localTime);
    }
  }
  for(var j=0;j<divUtc7.length;j++){
    var localTime = moment.utc($('#'+divUtc7[j].id).text()).toDate();
    localTime = moment(localTime).format('dddd');
    $('#'+divLocal7[j].id).text(localTime);
  }
  for(var k=0;k<divUtc365.length;k++){
    var localTime = moment.utc($('#'+divUtc365[k].id).text()).toDate();
    localTime = moment(localTime).format('l');
    // =====================           REMEMBER TO UN-COMMENT          =============================
    // if(moment(localTime).year() == moment().year()){
      localTimeAdjusted = localTime.substring(0, localTime.length - 5);
      $('#'+divLocal365[k].id).text(localTimeAdjusted);
    // } else{
    //   $('#'+divLocal365[k].id).text(localTime);
    // }
  }
});

// Copy college name
function copyTxtFn(){
  var range, selection, worked;
  var copyText = document.getElementById('copyTxt');
  if (document.body.createTextRange){
    range = document.body.createTextRange();
    range.moveToElementText(copyText);
    range.select();
  } else if (window.getSelection){
    selection = window.getSelection();        
    range = document.createRange();
    range.selectNodeContents(copyText);
    selection.removeAllRanges();
    selection.addRange(range);
  }
  
  try{
    document.execCommand('copy');
    var tooltip = document.getElementById("myTooltip");
    tooltip.innerHTML = "Copied: " + $('#copyTxt').text();
  }
  catch(err){
    alert('unable to copy text');
  }
}

function outCopyTxtFn(){
  var tooltip = document.getElementById("myTooltip");
  tooltip.innerHTML = "Copy to clipboard";
}

window.addEventListener('load', function(){
  Grade(document.querySelectorAll('.gradient-wrap'))
});

$('#toggleCollegePageViewKey').change(function(e){
  e.stopPropagation();
  var valueNum;
  if ($(this).is(':checked')){
    valueNum = 1;
  } else{
    valueNum = 2;
  }
  var input = $("<input>").attr("type", "hidden").attr("name", "initialCheckboxValue").val(valueNum);
  $('#toggleCollegePage-form').append(input);
  setTimeout(function(){
    var form = document.getElementById("toggleCollegePage-form");
    form.submit();
  }, 1000);
  $(this).prop('disabled', true);
  setTimeout(function(){
    btn.prop('disabled', false);
  }, 10000);
});

$('#client-posts-discover').on('click', '.discovercard', function(){
  var id = $(this).attr('id');
  var votecard = '#votecard'+id.substring(12);
  var top = $(this).position().top;
  var left = $(this).position().left;
  var width = $(this).width();
  var height = $(this).height();

  $(votecard).css({top: top, left: left, position:'absolute'}).width(width).height(height + 2);
  $(votecard).css('display', 'block');
});

$('#client-posts-discover').on('click', '.discover-overlay', function(e){
  var id = $(this).attr('id');
  var votecard = '#votecard'+id.substring(8);
  var likeBtnId = 'like-btn'+id.substring(8);
  var heartBtnId = 'heart-btn'+id.substring(8);
  if(e.target.parentElement.id == likeBtnId || e.target.parentElement.id == heartBtnId){
    return;
  } else{
    $(votecard).css('display', 'none');
  }
});

$('.chat-item').click(function(){
  var convIdCHATITEMprofileId = $(this).attr('id').split('^');
  var convId = convIdCHATITEMprofileId[0];
  var profileId = convIdCHATITEMprofileId[2];
  var type = $(this).attr('value');
  if(type == 'user'){
    $.post('/seen_msg/'+convId);
  } else if(type == 'club'){
    $.post('/seen_clubmsg/'+convId);
  }
  $('.chat-form').append('<input type="hidden" name="convId" value="'+convId+'">')
  .append('<input type="hidden" name="'+type+'" value="'+profileId+'">').submit();
});

var remToPx = function(count){
  var unit = $('html').css('font-size');
  if (typeof count !== 'undefined' && count>0){
    return (parseInt(unit)*count);
  }
  else{
    return parseInt(unit);
  }
}

function updateMessageHeight2(){
  function updateHeight(navheight){
    if($('.pushmsg').css('display') == 'block'){
      var newMsgHeight = window.innerHeight - 1.5*remToPx() - navheight - 31 - 42 - 35;
      $('#messages').height(newMsgHeight);
    } else{
      var newMsgHeight = window.innerHeight - 1.5*remToPx() - navheight - 31 - 42;
      $('#messages').height(newMsgHeight);
    }
  }
  if(window.innerWidth <= 768 && window.innerWidth > 480){
    updateHeight(40);
    document.getElementById("navbar").style.top = "0px";
  } else if(window.innerWidth <= 480 && window.innerWidth > 360){
    updateHeight(50 + 8);
    document.getElementById("navbar").style.top = "0px";
  } else if(window.innerWidth <= 360){
    updateHeight(42);
    document.getElementById("navbar").style.top = "0px";
  } else{
    if($('.pushmsg').css('display') == 'block'){
      $('#messages').addClass("msg_dec2");
    } else{
      $('#messages').removeClass("msg_dec2");
    }
  }
  return $('#messages').height();
}

function updateMessageHeight3(){
  function updateHeight(navheight,tabheight){
    if($('.pushmsg').css('display') == 'block'){
      var newMsgHeight = window.innerHeight - 1.5*remToPx() - navheight - tabheight - 42 - 35;
      $('#messages').height(newMsgHeight);
    } else{
      var newMsgHeight = window.innerHeight - 1.5*remToPx() - navheight - tabheight - 42;
      $('#messages').height(newMsgHeight);
    }
  }
  if(window.innerWidth <= 768 && window.innerWidth > 480){
    updateHeight(40,47);
    document.getElementById("navbar").style.top = "0px";
  } else if(window.innerWidth <= 480 && window.innerWidth > 360){
    updateHeight(50 + 8,52);
    document.getElementById("navbar").style.top = "0px";
  } else if(window.innerWidth <= 360){
    updateHeight(42,47);
    document.getElementById("navbar").style.top = "0px";
  } else{
    if($('.pushmsg').css('display') == 'block'){
      $('#messages').addClass("msg_dec3");
    } else{
      $('#messages').removeClass("msg_dec3");
    }
  }
  return $('#messages').height();
}

function dec_height(){
  $('#navbar').addClass('stuck');
  $('#messages').animate({scrollTop: $('#messages')[0].scrollHeight}, 1000);
  if($('#pin-chatbox').hasClass("pin-chatbox2")){
    updateMessageHeight2();
  } else if($('#pin-chatbox').hasClass("pin-chatbox3")){
    updateMessageHeight3();
  }
}

$("#myTab").on('click', '.nav-link', function(e){
  if($(this).attr('id') != 'chats-tab'){
    $('#navbar').removeClass('stuck');
  }
});

if(window.innerWidth < 768){
  if(!((location.pathname == '/chats') || 
  location.pathname.split('/').length == 3 && location.pathname.split('/')[1] == 'clubs' && 
  location.pathname.split('/')[2].match(/^[a-fA-F0-9]{24}$/) || 
  location.pathname.split('/').length == 3 && location.pathname.split('/')[1] == 'users' && 
  location.pathname.split('/')[2].match(/^[a-fA-F0-9]{24}$/))){
    if($('#notLoggedIn').length == 0){
      $('#mobile_toggler').addClass("nodisplay");
      $('.inbox_mobile').removeClass("nodisplay");
    }
  }
}

if(location.pathname == '/help/'){
  $(".navhelp").addClass('requests-active');
}
if(location.pathname == '/chats'){
  $("#inbox").addClass('requests-active');

  oldMsgHeightMobile = updateMessageHeight2();
  $(window).resize(function(){
    oldMsgHeightMobile = updateMessageHeight2() + 35;
  });
}

if(location.pathname.split('/').length == 3 && location.pathname.split('/')[1] == 'clubs' && 
  location.pathname.split('/')[2].match(/^[a-fA-F0-9]{24}$/)){
  // Ask for club invite
  if(!$('#memberReq-btn').length && $('#cancelReq-btn').length){
    $('#memberReq-div').addClass("nodisplay");
  }
  if(window.innerWidth < 360){
    $('#requests-tab').text('Req');
  }

  oldMsgHeightMobile = updateMessageHeight3();
  $(window).resize(function(){
    oldMsgHeightMobile = updateMessageHeight3() + 35;
  });
}

if(location.pathname.split('/').length == 3 && location.pathname.split('/')[1] == 'users' && 
  location.pathname.split('/')[2].match(/^[a-fA-F0-9]{24}$/)){
  if(window.innerWidth < 768){
    if($('#mypage').length){
      $('#brandname').addClass("name-green");
    }
  } else{
    if(!$('#latestUpdates').hasClass('clubupdates') && $('#latestUpdates-count').text() != 0){
      $('#latestUpdates').addClass('show');
    }
  }
  
  oldMsgHeightMobile = updateMessageHeight3();
  $(window).resize(function(){
    oldMsgHeightMobile = updateMessageHeight3() + 35;
  });
}

// Multi line chat input - readjust #messages margins and height
oldMsgHeightDesktop = $('#messages').height();
$('textarea').on('input', function(){
  if($(this).hasClass('chatinput')){
    this.style.height = 'auto';
    if(this.scrollHeight < 100){
      this.style.height = (this.scrollHeight) + 'px';
      if(window.innerWidth <= 768 && window.innerWidth > 480){
        $('#messages').css('margin-bottom', (this.scrollHeight + 8) + 'px');
        $('#messages').height(oldMsgHeightMobile - (this.scrollHeight + 1));
      } else if(window.innerWidth <= 480 && window.innerWidth > 360){
        $('#messages').css('margin-bottom', (this.scrollHeight + 8) + 'px');
        $('#messages').height(oldMsgHeightMobile - (this.scrollHeight - 3));
      } else if(window.innerWidth <= 360){
        $('#messages').css('margin-bottom', (this.scrollHeight + 8) + 'px');
        $('#messages').height(oldMsgHeightMobile - (this.scrollHeight + 1));
      } else{
        $('#messages').css('margin-bottom', (this.scrollHeight + 12) + 'px');
        $('#messages').height(oldMsgHeightDesktop - (this.scrollHeight + 5));
      }
    } else{
      this.style.height = 96 + 'px';
      if(window.innerWidth <= 768 && window.innerWidth > 480){
        $('#messages').css('margin-bottom', (96 + 8) + 'px');
        $('#messages').height(oldMsgHeightMobile - (96 + 1));
      } else if(window.innerWidth <= 480 && window.innerWidth > 360){
        $('#messages').css('margin-bottom', (96 + 8) + 'px');
        $('#messages').height(oldMsgHeightMobile - (96 - 3));
      } else if(window.innerWidth <= 360){
        $('#messages').css('margin-bottom', (96 + 8) + 'px');
        $('#messages').height(oldMsgHeightMobile - (96 + 1));
      } else{
        $('#messages').css('margin-bottom', (96 + 12) + 'px');
        $('#messages').height(oldMsgHeightDesktop - (96 + 5));
      }
    }
  } else{
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  }
});


//================================================================================
// AJAX
//================================================================================
// Expensive event delegation?
if((location.pathname.split('/').length == 5 && location.pathname.split('/')[1] == 'clubs' && 
  location.pathname.split('/')[3] == 'posts' && location.pathname.split('/')[2].match(/^[a-fA-F0-9]{24}$/))){
  $("div#delegated-posts").on('click', '.vote', function(e){
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
        $('#like-count'+data.foundPost._id).text(data.foundPost.likeCount);
        $('#heart-count'+data.foundPost._id).text(data.foundPost.heartCount);

        if(formData[1].name == 'like'){
          if($('#like-btn'+data.foundPost._id).html() == '<i class="fas fa-thumbs-up greencolor"></i>'){
            $('#like-btn'+data.foundPost._id).html('<i class="far fa-thumbs-up"></i>');
          }
          else if($('#like-btn'+data.foundPost._id).html() == '<i class="far fa-thumbs-up"></i>'
          || $('#heart-btn'+data.foundPost._id).html() == '<i class="fas fa-heart redcolor2"></i>'){
            $('#like-btn'+data.foundPost._id).html('<i class="fas fa-thumbs-up greencolor"></i>');
            $('#heart-btn'+data.foundPost._id).html('<i class="far fa-heart"></i>');
          }
          $('#like-count'+data.foundPost._id).toggleClass('greencolor3');
          $('#heart-count'+data.foundPost._id).removeClass('redcolor3');
        }
        if(formData[1].name == 'heart'){
          if($('#heart-btn'+data.foundPost._id).html() == '<i class="fas fa-heart redcolor2"></i>'){
            $('#heart-btn'+data.foundPost._id).html('<i class="far fa-heart"></i>');
          }
          else if($('#heart-btn'+data.foundPost._id).html() == '<i class="far fa-heart"></i>'
          || $('#like-btn'+data.foundPost._id).html() == '<i class="fas fa-thumbs-up greencolor"></i>'){
            $('#heart-btn'+data.foundPost._id).html('<i class="fas fa-heart redcolor2"></i>');
            $('#like-btn'+data.foundPost._id).html('<i class="far fa-thumbs-up"></i>');
          }
          $('#like-count'+data.foundPost._id).removeClass('greencolor3');
          $('#heart-count'+data.foundPost._id).toggleClass('redcolor3');
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
} else if(location.pathname.split('/').length == 2 && location.pathname.split('/').pop() == 'discover'){
  $("div#delegated-posts-discover").on('click', '.vote', function(e){
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
        $('#like-count'+data.foundPost._id).text(data.foundPost.likeCount);
        $('#heart-count'+data.foundPost._id).text(data.foundPost.heartCount);

        if(formData[1].name == 'like'){
          if($('#like-btn'+data.foundPost._id).html() == '<i class="fas fa-thumbs-up discover-vote greencolor"></i>'){
            $('#like-btn'+data.foundPost._id).html('<i class="far fa-thumbs-up discover-vote"></i>');
          }
          else if($('#like-btn'+data.foundPost._id).html() == '<i class="far fa-thumbs-up discover-vote"></i>'
          || $('#heart-btn'+data.foundPost._id).html() == '<i class="fas fa-heart discover-vote redcolor2"></i>'){
            $('#like-btn'+data.foundPost._id).html('<i class="fas fa-thumbs-up discover-vote greencolor"></i>');
            $('#heart-btn'+data.foundPost._id).html('<i class="far fa-heart discover-vote"></i>');
          }
          $('#like-count'+data.foundPost._id).toggleClass('greencolor2');
          $('#heart-count'+data.foundPost._id).removeClass('redcolor2');
        }
        if(formData[1].name == 'heart'){
          if($('#heart-btn'+data.foundPost._id).html() == '<i class="fas fa-heart discover-vote redcolor2"></i>'){
            $('#heart-btn'+data.foundPost._id).html('<i class="far fa-heart discover-vote"></i>');
          }
          else if($('#heart-btn'+data.foundPost._id).html() == '<i class="far fa-heart discover-vote"></i>'
          || $('#like-btn'+data.foundPost._id).html() == '<i class="fas fa-thumbs-up discover-vote greencolor"></i>'){
            $('#heart-btn'+data.foundPost._id).html('<i class="fas fa-heart discover-vote redcolor2"></i>');
            $('#like-btn'+data.foundPost._id).html('<i class="far fa-thumbs-up discover-vote"></i>');
          }
          $('#like-count'+data.foundPost._id).removeClass('greencolor2');
          $('#heart-count'+data.foundPost._id).toggleClass('redcolor2');
        }

        setTimeout(function(){
          var votecard = '#votecard'+data.foundPost._id;
          $(votecard).css('display', 'none');
        }, 1000);
      },
      error: function(xhr) {
        if(xhr.status == 404){
          alert("Please Login first");
          location = "/login";
        } else{alert("Error "+xhr.status+": "+ xhr.statusText);}
      }
    })
  });
} else{
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
        $('#like-count'+data.foundPost._id).text(data.foundPost.likeCount);
        $('#heart-count'+data.foundPost._id).text(data.foundPost.heartCount);

        if(formData[1].name == 'like'){
          if($('#like-btn'+data.foundPost._id).html() == '<i class="fas fa-thumbs-up greencolor"></i>'){
            $('#like-btn'+data.foundPost._id).html('<i class="far fa-thumbs-up"></i>');
            $('#like-count'+data.foundPost._id).addClass('nodisplay');
          }
          else if($('#like-btn'+data.foundPost._id).html() == '<i class="far fa-thumbs-up"></i>'
          || $('#heart-btn'+data.foundPost._id).html() == '<i class="fas fa-heart redcolor2"></i>'){
            $('#like-btn'+data.foundPost._id).html('<i class="fas fa-thumbs-up greencolor"></i>');
            $('#like-count'+data.foundPost._id).removeClass('nodisplay');
            $('#heart-btn'+data.foundPost._id).html('<i class="far fa-heart"></i>');
          }
          $('#like-count'+data.foundPost._id).toggleClass('greencolor3');
          $('#heart-count'+data.foundPost._id).removeClass('redcolor3').addClass('nodisplay');
        }
        if(formData[1].name == 'heart'){
          if($('#heart-btn'+data.foundPost._id).html() == '<i class="fas fa-heart redcolor2"></i>'){
            $('#heart-btn'+data.foundPost._id).html('<i class="far fa-heart"></i>');
            $('#heart-count'+data.foundPost._id).addClass('nodisplay');
          }
          else if($('#heart-btn'+data.foundPost._id).html() == '<i class="far fa-heart"></i>'
          || $('#like-btn'+data.foundPost._id).html() == '<i class="fas fa-thumbs-up greencolor"></i>'){
            $('#heart-btn'+data.foundPost._id).html('<i class="fas fa-heart redcolor2"></i>');
            $('#heart-count'+data.foundPost._id).removeClass('nodisplay');
            $('#like-btn'+data.foundPost._id).html('<i class="far fa-thumbs-up"></i>');
          }
          $('#like-count'+data.foundPost._id).removeClass('greencolor3').addClass('nodisplay');
          $('#heart-count'+data.foundPost._id).toggleClass('redcolor3');
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
}

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
      if(formData[1].name == 'published'){
        $('#moderation'+data.foundPost._id).removeClass('btn-light').addClass('btn-info').text('Published')
        .attr('name','exclusive').attr('value',1).blur();
        $('#mod-badge'+data.foundPost._id).text('0');
      }
      if(formData[1].name == 'exclusive'){
        $('#moderation'+data.foundPost._id).removeClass('btn-info').addClass('btn-light').text('Exclusive')
        .attr('name','published').attr('value',0).blur();
        $('#mod-badge'+data.foundPost._id).text('1');
      }
      if(formData[1].name == 'visibility'){
        if(formData[1].value == '-1'){
          $('#mod-badge'+data.foundPost._id).removeClass('badge-light').addClass('badge-danger').text('-1');
          $('#visibility'+data.foundPost._id).text('Visibility(Show)').val('1');
          if(data.isOwner == true){
            $('#moderation'+data.foundPost._id).remove();
            $('#modVisibility'+data.foundPost._id).removeClass('createdButton');
          }
        } else if(formData[1].value == '1'){
          $('#visibility'+data.foundPost._id).text('Visibility(Hide)').val('-1');
          $('#mod-badge'+data.foundPost._id).removeClass('badge-danger').addClass('badge-light').text('1');
          if(data.isOwner == true){
            var mySpan = document.getElementById('modVisibility'+data.foundPost._id);
            if(data.foundPost.topic == '' && !$('#modVisibility'+data.foundPost._id).hasClass('createdButton')){
              var btnVisibility = document.createElement('button');
              btnVisibility.setAttribute('id', 'moderation'+data.foundPost._id);
              btnVisibility.classList.add('moderation','btn','btnxxs','btn-light','noshadow','text-sm','ml-2');
              btnVisibility.setAttribute('name', 'published');
              btnVisibility.setAttribute('value', '0');
              btnVisibility.setAttribute('title', 'Post moderation');
              btnVisibility.setAttribute('type', 'submit');
              btnVisibility.innerHTML = 'Exclusive';
              mySpan.appendChild(btnVisibility);
            }
            $('#modVisibility'+data.foundPost._id).removeClass('nodisplay').addClass('nopad').addClass('createdButton');
          }
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
      $('#modVote-count'+data.foundPost._id).text(data.foundPost.upVoteCount - data.foundPost.downVoteCount);

      if(formData[1].name == 'upVote'){
        $('#upVote-btn'+data.foundPost._id).toggleClass('bluecolor on');
        if($('#modVote-count'+data.foundPost._id).hasClass('bluecolor3')){
          $('#modVote-count'+data.foundPost._id).removeClass('bluecolor3');
        } else{
          $('#modVote-count'+data.foundPost._id).removeClass('darkgrey').removeClass('orangecolor').addClass('bluecolor3');
        }
        $('#downVote-btn'+data.foundPost._id).removeClass('orangecolor on');
      }
      if(formData[1].name == 'downVote'){
        $('#downVote-btn'+data.foundPost._id).toggleClass('orangecolor on');
        if($('#modVote-count'+data.foundPost._id).hasClass('orangecolor')){
          $('#modVote-count'+data.foundPost._id).removeClass('orangecolor');
        } else{
          $('#modVote-count'+data.foundPost._id).removeClass('darkgrey').removeClass('bluecolor3').addClass('orangecolor');
        }
        $('#upVote-btn'+data.foundPost._id).removeClass('bluecolor on');
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
      $('#like-countH'+data.foundPost._id).text(data.foundPost.likeCount);
      $('#heart-countH'+data.foundPost._id).text(data.foundPost.heartCount);

      if(formData[1].name == 'like'){
        if($('#like-btnH'+data.foundPost._id).html() == '<i class="fas fa-thumbs-up greencolor"></i>'){
          $('#like-btnH'+data.foundPost._id).html('<i class="far fa-thumbs-up"></i>');
          $('#like-countH'+data.foundPost._id).addClass('nodisplay');
        }
        else if($('#like-btnH'+data.foundPost._id).html() == '<i class="far fa-thumbs-up"></i>'
        || $('#heart-btnH'+data.foundPost._id).html() == '<i class="fas fa-heart redcolor2"></i>'){
          $('#like-btnH'+data.foundPost._id).html('<i class="fas fa-thumbs-up greencolor"></i>');
          $('#like-countH'+data.foundPost._id).removeClass('nodisplay');
          $('#heart-btnH'+data.foundPost._id).html('<i class="far fa-heart"></i>');
        }
        $('#like-countH'+data.foundPost._id).toggleClass('greencolor3');
        $('#heart-countH'+data.foundPost._id).removeClass('redcolor3');
      }
      if(formData[1].name == 'heart'){
        if($('#heart-btnH'+data.foundPost._id).html() == '<i class="fas fa-heart redcolor2"></i>'){
          $('#heart-btnH'+data.foundPost._id).html('<i class="far fa-heart"></i>');
          $('#heart-countH'+data.foundPost._id).addClass('nodisplay');
        }
        else if($('#heart-btnH'+data.foundPost._id).html() == '<i class="far fa-heart"></i>'
        || $('#like-btnH'+data.foundPost._id).html() == '<i class="fas fa-thumbs-up greencolor"></i>'){
          $('#heart-btnH'+data.foundPost._id).html('<i class="fas fa-heart redcolor2"></i>');
          $('#heart-countH'+data.foundPost._id).removeClass('nodisplay');
          $('#like-btnH'+data.foundPost._id).html('<i class="far fa-thumbs-up"></i>');
        }
        $('#like-countH'+data.foundPost._id).removeClass('greencolor3');
        $('#heart-countH'+data.foundPost._id).toggleClass('redcolor3');
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
      $('#modVote-countH'+data.foundPost._id).text(data.foundPost.upVoteCount - data.foundPost.downVoteCount);

      if(formData[1].name == 'upVote'){
        $('#upVote-btnH'+data.foundPost._id).toggleClass('bluecolor');
        if($('#modVote-countH'+data.foundPost._id).hasClass('bluecolor3')){
          $('#modVote-countH'+data.foundPost._id).removeClass('bluecolor3');
        } else{
          $('#modVote-countH'+data.foundPost._id).removeClass('darkgrey').removeClass('orangecolor').addClass('bluecolor3');
        }
        $('#downVote-btnH'+data.foundPost._id).removeClass('orangecolor');
      }
      if(formData[1].name == 'downVote'){
        $('#downVote-btnH'+data.foundPost._id).toggleClass('orangecolor');
        if($('#modVote-countH'+data.foundPost._id).hasClass('orangecolor')){
          $('#modVote-countH'+data.foundPost._id).removeClass('orangecolor');
        } else{
          $('#modVote-countH'+data.foundPost._id).removeClass('darkgrey').removeClass('bluecolor3').addClass('orangecolor');
        }
        $('#upVote-btnH'+data.foundPost._id).removeClass('bluecolor');
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
      $('#comment-up-count'+data.foundComment.comments[0]._id).text(data.foundComment.comments[0].upvotesCount);

      if(formData[1].name == 'commentUp'){
        $('#comment-up-btn'+data.foundComment.comments[0]._id).toggleClass('bluecolor');
        $('#comment-up-count'+data.foundComment.comments[0]._id).toggleClass('bluecolor3');
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
      $('#like-count'+data.foundClickId.subPosts[0]._id).text(data.foundClickId.subPosts[0].likeCount);
      $('#dislike-count'+data.foundClickId.subPosts[0]._id).text(data.foundClickId.subPosts[0].dislikeCount);

      if(formData[1].name == 'subLike'){
        if($('#like-btn'+data.foundClickId.subPosts[0]._id).html() == '<i class="fas fa-thumbs-up greencolor"></i>'){
          $('#like-btn'+data.foundClickId.subPosts[0]._id).html('<i class="vote-subpost far fa-thumbs-up"></i>');
        }
        else if($('#like-btn'+data.foundClickId.subPosts[0]._id).html() == '<i class="vote-subpost far fa-thumbs-up"></i>'
        || $('#dislike-btn'+data.foundClickId.subPosts[0]._id).html('<i class="fas fa-thumbs-down blackcolor"></i>')){
          $('#like-btn'+data.foundClickId.subPosts[0]._id).html('<i class="fas fa-thumbs-up greencolor"></i>');
          $('#dislike-btn'+data.foundClickId.subPosts[0]._id).html('<i class="vote-subpost far fa-thumbs-down"></i>');
        }
        $('#like-count'+data.foundClickId.subPosts[0]._id).toggleClass('greencolor3');
        $('#dislike-count'+data.foundClickId.subPosts[0]._id).removeClass('blackcolor');
      }
      if(formData[1].name == 'subDislike'){
        if($('#dislike-btn'+data.foundClickId.subPosts[0]._id).html() == '<i class="fas fa-thumbs-down blackcolor"></i>'){
          $('#dislike-btn'+data.foundClickId.subPosts[0]._id).html('<i class="vote-subpost far fa-thumbs-down"></i>');
        }
        else if($('#dislike-btn'+data.foundClickId.subPosts[0]._id).html() == '<i class="vote-subpost far fa-thumbs-down"></i>'
        || $('#like-btn'+data.foundClickId.subPosts[0]._id).html('<i class="fas fa-thumbs-up greencolor"></i>')){
          $('#dislike-btn'+data.foundClickId.subPosts[0]._id).html('<i class="fas fa-thumbs-down blackcolor"></i>');
          $('#like-btn'+data.foundClickId.subPosts[0]._id).html('<i class="vote-subpost far fa-thumbs-up"></i>');
        }
        $('#like-count'+data.foundClickId.subPosts[0]._id).removeClass('greencolor3');
        $('#dislike-count'+data.foundClickId.subPosts[0]._id).toggleClass('blackcolor');
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
