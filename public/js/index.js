/* When the user scrolls down, hide the navbar. When the user scrolls up, show the navbar */
var prevScrollpos = window.pageYOffset;
window.onscroll = function(){
  var currentScrollPos = window.pageYOffset;
  var navbar = document.getElementById("navbar");
  var pop_box_requests = document.getElementById("pop_box_requests");
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


  if(quickview_nav_mobile){
    if(scroll > 40){
      quickview_nav_mobile.classList.add("nav-hidden");
    } else{
      quickview_nav_mobile.classList.remove("nav-hidden");
    }
  }
  if(quickview_nav_desktop){
    if(scroll > 40){
      quickview_nav_desktop.classList.add("nav-hidden");
      discover_nav_desktop.classList.add("nav-hidden");
    } else{
      quickview_nav_desktop.classList.remove("nav-hidden");
      discover_nav_desktop.classList.remove("nav-hidden");
    }
  }
  if(discover_chatlist){
    if(scroll > 40){
      discover_chatlist.classList.add("nav-hidden");
    } else{
      discover_chatlist.classList.remove("nav-hidden");
    }
  }
}

//Sidebar dropdown
var dropdown = document.getElementsByClassName('dropdown-sidebar');
for (var i=0;i<dropdown.length;i++){
  dropdown[i].addEventListener('click', function(){
    this.classList.toggle('active');
    if(location.pathname.split('/').length == 3 && location.pathname.split('/')[1] == 'colleges'){
      var home = document.getElementById('side-home');
      home.classList.toggle('active');
    } else if(location.pathname == '/discover'){
      var discover = document.getElementById('side-discover');
      discover.classList.toggle('active');
      if(document.documentElement.scrollTop < 350){
        quickview_nav_desktop.classList.toggle("nav-hidden");
      }
    } else if(location.pathname == '/lobby'){
      var lobby = document.getElementById('side-lobby');
      lobby.classList.toggle('active');
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

// Quick view buttons
const links_mobile = document.querySelectorAll('.quicknav_link_mobile');
links_mobile.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    if (!link.classList.contains('active')){
      const active = document.querySelector('.quicknav_link_mobile.active');
      if (active !== null){
        active.classList.remove('active');
      }
      link.classList.add('active');
    } else{
      document.querySelector('.quicknav_link_mobile.active').classList.remove('active');
    }
  });
});
const quickview_containers_desktop = document.querySelectorAll('.quickviewcontainers-desktop');
quickview_containers_desktop.forEach(button => {
  button.addEventListener('click', e => {
    e.preventDefault();
    if (!button.classList.contains('active')){
      const active = document.querySelector('.quickviewcontainers-desktop.active');
      if (active !== null){
        active.classList.remove('active');
      }
      button.classList.add('active');
    } else{
      document.querySelector('.quickviewcontainers-desktop.active').classList.remove('active');
    }
  });
});
function close_quickview_modal(){
  links_mobile.forEach(link => {
    if (!link.classList.contains('active')){
      let active = document.querySelector('.quicknav_link_mobile.active');
      if (active !== null){
        active.classList.remove('active');
      }
    }
  });

  quickview_containers_desktop.forEach(button => {
    if (!button.classList.contains('active')){
      const active = document.querySelector('.quickviewcontainers-desktop.active');
      if (active !== null){
        active.classList.remove('active');
      }
    }
  });
}

if(location.pathname.split('/').length == 3 && location.pathname.split('/')[1] == 'colleges'){
  var home = document.getElementById('side-home');
  home.classList.toggle('active');
} else if(location.pathname == '/discover'){
  var discover_chatlist = document.getElementById("discover_chatlist");
  var discover_nav_mobile = document.getElementById("discover_nav_mobile");
  var discover_nav_desktop = document.getElementById("discover_nav_desktop");
  var quickview_nav_desktop = document.getElementById("quickview_nav_desktop");
  var quickview_nav_mobile = document.getElementById("quickview_nav_mobile");
  if(window.innerWidth > 768){
    if(quickview_nav_desktop){
      quickview_nav_desktop.classList.remove("nav-hidden");
    }
  } else{
    discover_nav_mobile.classList.remove("nav-hidden");
  }

  var discover = document.getElementById('side-discover');
  discover.classList.toggle('active');
} else if(location.pathname == '/lobby'){
  var lobby = document.getElementById('side-lobby');
  lobby.classList.toggle('active');
}

$('#latestUpdates').on('shown.bs.collapse', function(){
  if($('#pushnew').hasClass('admin')){
    $('#latestUpdates').animate({scrollTop: 101}, 500);
  } else if($('#pushnew').hasClass('moderator')){
    $('#latestUpdates').animate({scrollTop: 59}, 500);
  }
})

window.addEventListener('load', function(){
  Grade(document.querySelectorAll('.gradient-wrap'), null, function(gradientData){
    var gradColor = $('.gradient-wrap').css('color');
    var gradNiceColor = $('.gradient-wrap').css('border-color');
    $('#btncollapse-club').css('color', gradNiceColor);
  });
});

$('#carouselControls').on('slide.bs.carousel', function(e){
  // Bootstrap slide event provides 4 properties: direction, relatedTarget, from, to
  var indexOfComingImg = e.to;
  $('#btncollapse-club').css('color', $('.gradient-wrap').eq(indexOfComingImg).css('border-color'));
});

$('.btncollapse-div').on('click', 'button.btncollapse-club', function(){
  if(!$('.gradient-wrap.rcov').hasClass('nofill')){
    $('.gradient-wrap.rcov').addClass('nofill');
    $('#btncollapse-club').addClass('nofill-color');
  } else{
    $('.gradient-wrap.rcov').removeClass('nofill');
    $('#btncollapse-club').removeClass('nofill-color');
  }
})

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
    $('#menu-toggle').html('<i class="fas fa-bars"></i>');
  } else if(sidebar.style.display === 'none'){
    $('#menu-toggle').html('<i class="fas fa-minus"></i>');
  }
}

$('#input_topic').on('input', function(e){
  if($(this).val() != ''){
    $('#priv_everyone').removeAttr('selected');
    $('#priv_everyone').attr('disabled', 'true');
    $('#priv_college').attr('selected', 'true');
    $('#description').attr('placeholder', 'Describe your blog');
  } else{
    $('#priv_college').removeAttr('selected');
    $('#priv_everyone').removeAttr('disabled');
    $('#priv_everyone').attr('selected', 'true');
    $('#description').attr('placeholder', 'Write a post');
  }
});

$('#description').on('input', function(e){
  if($(this).val() != ''){
    $('#preview-postimg').removeClass('invisible');
  } else{
    $('#preview-postimg').addClass('invisible');
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
    selectList.classList.add('select3');
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

// Remove loading spinner
function remove_loading_spinner(targetId, checkId){
  var targetIdVar = '#'+targetId; var checkIdVar = '#'+checkId;
  if(checkId == '' || (checkId != '' && $(checkIdVar).val() != '')){
    $(targetIdVar).removeClass("spinner-border spinner-border-sm mr-1");
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

function toggle_visibility(id){
  var divelement = document.getElementById(id);
  if(divelement.style.visibility == 'visible')
    divelement.style.visibility = 'hidden';
  else
    divelement.style.visibility = 'visible';
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

function add_new_inputs(id,name,placeholder){
  var divelement = document.getElementById(id);
  var input = document.createElement('input');
  input.setAttribute('type', 'text');
  if(id == 'dishes_inputs'){
    input.classList.add('form-control', 'info-form');
  } else{
    input.classList.add('form-control','form-control-sm', 'info-form');
  }
  input.setAttribute('name', name);
  input.setAttribute('placeholder', placeholder);
  divelement.appendChild(input);
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

// Label path for input image file
$('#inputImage').change(function(){
	var fileName = $('#inputImage')[0].files[0].name;
	var truncated = fileName.trunc(15);
	$(this).prev('label').text(truncated);
  $(this).prev('label').css({'border': 'none', 'boxShadow':'none'});

  var file = this.files[0];
  if (file){
    let reader = new FileReader();
    reader.onload = function(event){
      $('#preview-postimg').attr('src', event.target.result);
    }
    reader.readAsDataURL(file);
    $('#preview-postimg').removeClass('invisible').addClass('active');
  }
});

$('#inputImages10').change(function(){
  var fileNum = $('#inputImages10')[0].files.length;
  var labelText = fileNum+' files';
  var fileName = $('#inputImages10')[0].files[0].name;
  var truncated = fileName.trunc(20);

  if(fileNum > 1){
    $(this).prev('label').text(labelText);
  } else {
    $(this).prev('label').text(truncated);
  }
  $(this).prev('label').css({'border': 'none', 'boxShadow':'none'});
});

$('#inputprofilePic').change(function(){
	var fileName = $('#inputprofilePic')[0].files[0].name;
	var truncated = fileName.trunc(15);
	$(this).prev('label').text(truncated);
	$('#inputprofilePicSubmitBtn').css('display','block');
});
$('#inputclubAvatar').change(function(){
	var fileName = $('#inputclubAvatar')[0].files[0].name;
	var truncated = fileName.trunc(15);
	$(this).prev('label').text(truncated);
  $('#inputclubAvatarSubmitBtn').css('display','block');
});
$('#inputroomAvatar').change(function(){
	var fileName = $('#inputroomAvatar')[0].files[0].name;
	var truncated = fileName.trunc(10);
	$(this).prev('label').find('.overlay4-text').text(truncated);
  $('#inputroomAvatarSubmitBtn').css('display','block');
});
$('.featuredImage').change(function(){
  var i = $(this).prev('label').clone();
  var file = $(this)[0].files[0].name;
  var truncated = file.trunc(15);
  $(this).prev('label').find('.overlay4-text').text(truncated);
});
$('#inputcollegeCover').change(function(){
	var fileName = $('#inputcollegeCover')[0].files[0].name;
	var truncated = fileName.trunc(15);
	$(this).prev('label').find('.overlay4-text').text(truncated);
  $('#inputcollegeCoverSubmitBtn').css('display','block');
});

var cw = $('.subPostimg').width();
$('.subPostimg').css({'height':cw+'px'});

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

$('#profilePic-frame-div-desktop').mouseenter(function (e){
  $('#delete_profilePic-desktop').css('display', 'block');
}).mouseleave(function(){
  $('#delete_profilePic-desktop').css('display', 'none');
});
$('#profilePic-frame-div-mobile').mouseenter(function (e){
  $('#delete_profilePic-mobile').css('display', 'block');
}).mouseleave(function(){
  $('#delete_profilePic-mobile').css('display', 'none');
});

////////////////// System emoji picker //////////////////
$('.emoji-panel').on("click","#emoji-picker", function(e){
  e.stopPropagation();
  $('.intercom-composer-emoji-popover').addClass("active");
});
$(document).click(function (e) {
  if ($(e.target).attr('class') != '.intercom-composer-emoji-popover' && $(e.target).parents(".intercom-composer-emoji-popover").length == 0) {
    $(".intercom-composer-emoji-popover").removeClass("active");
  }
});
$('.emoji-panel').on("click",".intercom-emoji-picker-emoji",function(e){
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

// EVENT DATE WIDGETS
$("#datetimepicker-dateonly").on("change.datetimepicker", ({date}) => {
  if($("#datetimepicker-dateonly").find("input").val()){
    $('#event-date').css('opacity', '');
    $('#calendar-outerdiv').css('opacity', '');
    $('#calendar-strong, #calendar-span, #calendar-em').removeClass('transparent-text');
  } else{
    $('#event-date').css('opacity', '0.5');
    $('#calendar-outerdiv').css('opacity', '0.25');
    $('#calendar-strong, #calendar-span, #calendar-em').addClass('transparent-text');
  }
  $('#calendar-strong').text(moment(date).format('MMM'));
  $('#calendar-span').text(moment(date).format('D'));
  $('#calendar-em').text(moment(date).format('dddd'));
});

$("#datetimepicker-timeonly").on("change.datetimepicker", ({date}) => {
  if($("#datetimepicker-timeonly").find("input").val()){
    $('#eventTime').css('opacity', '');
    $('#clock-outerdiv').css('opacity', '');
    $('#clock-hour, #clock-minute').removeClass('transparent-text');
  } else{
    $('#eventTime').css('opacity', '0.5');
    $('#clock-outerdiv').css('opacity', '0.25');
    $('#clock-hour, #clock-minute').addClass('transparent-text');
  }
  $('#clock-hour').text(moment(date).format('HH'));
  $('#clock-minute').text(moment(date).format('mm'));

  // Also set date to current if not previously set
  if(!$("#datetimepicker-dateonly").find("input").val()){
    $('#event-date').css('opacity', '');
    $('#calendar-outerdiv').css('opacity', '');
    $('#calendar-strong, #calendar-span, #calendar-em').removeClass('transparent-text');

    $('#datetimepicker-dateonly').data("datetimepicker").date(moment(new Date ).format('L'));
    $('#calendar-strong').text(moment(date).format('MMM'));
    $('#calendar-span').text(moment(date).format('D'));
    $('#calendar-em').text(moment(date).format('dddd'));
  }
});

$('#event-notice').on('input', function(e){
  if($(this).val() != ''){
    $(this).css('opacity', '');
  } else{
    $(this).css('opacity', '0.5');
  }
});

$(function (){
  $('#datetimepicker-dateonly').datetimepicker({format: 'L'});
  $('#datetimepicker-timeonly').datetimepicker({format: 'LT'});
  // setTimeout(function(){
    var divUtc = $('#timeUTC');
    var divLocal = $('#timeLocal');
    var divUtc2 = $('#timeUTC2');
    var divLocal2 = $('#timeLocal2');
    var divLocalRelative = $('#timeLocalRelative');
    
    //get text from timeUTC and convert to local timezone  
    var localTimeOriginal = moment.utc(divUtc.text()).toDate();
    var localTime = moment(localTimeOriginal).format('LT');
    divLocal.text(localTime);
    divLocal.attr({'title': moment(localTimeOriginal).format('l')});

    var localTime2 = moment.utc(divUtc2.text()).toDate();
    localTime2 = moment(localTime2).format('LT');
    divLocal2.text(localTime2);

    var localTimeRelative = moment.utc(divUtc.text()).toDate();
    localTimeRelative = moment(localTimeRelative).fromNow();
    divLocalRelative.text(localTimeRelative);
  // }, 500);

  var divUtc1 = document.getElementsByClassName('timeUTC1');
  var divLocal1 = document.getElementsByClassName('timeLocal1');
  var divUtc3 = document.getElementsByClassName('timeUTC3');
  var divLocal3 = document.getElementsByClassName('timeLocal3');
  var divUtc7 = document.getElementsByClassName('timeUTC7');
  var divLocal7 = document.getElementsByClassName('timeLocal7');
  var divUtc365 = document.getElementsByClassName('timeUTC365');
  var divLocal365 = document.getElementsByClassName('timeLocal365');

  if(location.pathname.split('/')[1] == 'chats'){
    var timeUTC_Chats = document.getElementsByClassName('timeUTC_Chats');
    for(var i=0;i<timeUTC_Chats.length;i++){
      timeUTC_Chats[i].classList.add('d-none');
    }
  }
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

// College cover
if(location.pathname.split('/').length == 3 && location.pathname.split('/')[1] == 'colleges'){
  // Setting height of list based on window height instead of using non performant css calc property
  var vh = $(window).height();
  if(window.innerWidth > 768){
    var heightVal = vh - 16 - 50;
  } else if(window.innerWidth <= 768 && window.innerWidth > 480){
    var heightVal = vh - 16 - 44;
  } else if(window.innerWidth <= 480 && window.innerWidth > 360){
    var heightVal = vh - 16 - 50;
  } else if(window.innerWidth <= 360){
    var heightVal = vh - 16 - 42;
  }
  var heightText = 'height:'+heightVal+'px !important';
  $('#college_scroll').css('cssText', heightText);

  var coverTall = false;
  $('#college_scroll').scroll(function(){
    if(!coverTall){
      if((window.innerWidth > 1366) && ($('#college_scroll').scrollTop() > 300)){
        coverTall = true;
        $('.college-cover-div').css('cssText', 'height: 565px !important');
        $('img#college-cover').removeClass('desktopFit');
      } else if((window.innerWidth <= 1366 && window.innerWidth > 992) && ($('#college_scroll').scrollTop() > 160)){
        coverTall = true;
        $('.college-cover-div').height(350);
        $('img#college-cover').removeClass('desktopFit');
      } else if((window.innerWidth <= 992 && window.innerWidth > 768) && ($('#college_scroll').scrollTop() > 142)){
        coverTall = true;
        $('.college-cover-div').height(300);
        $('img#college-cover').removeClass('mobileblurred');
        $('.college-infodiv').addClass('d-none').removeClass('tabletShow');
        $('img#college-cover').removeClass('desktopFit');
      } else if((window.innerWidth <= 768) && ($('#college_scroll').scrollTop() > 142)){
        coverTall = true;
        $('.college-cover-div').height(300);
        $('img#college-cover').removeClass('mobileblurred');
        $('.college-infodiv').addClass('d-none');
      }
    }
  });
}

$('.togglePostsView-form').on('click', function(){
  $('.circle-plus').toggleClass('opened');
  setTimeout(function(){
    var form = document.getElementsByClassName('togglePostsView-form');
    form[0].submit();
    $('.posts_view_key').attr('value', '0');
  }, 500);
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

// Discover post-vote overlay
if(location.pathname.split('/').length == 2 && location.pathname.split('/')[1] == 'discover'){
  $('#client-posts-discover').on('click', '.discovercard', function(){
    var id = $(this).attr('id');
    var votecard = '#votecard'+id.substring(12);
    var top = $(this).position().top;
    var left = $(this).position().left;
    var width = $(this).width();
    var height = $(this).height();

    $(votecard).css({top: top, left: left, position:'absolute'}).width(width).height(height + 2);
    if(!$(this).hasClass('right')){
      $(votecard).addClass('votecard_left');
    }
    $(votecard).css('display', 'block');
    
    var votecardIdWithoutHash = votecard.substring(1);
    $(".discover-overlay:not([id*='"+votecardIdWithoutHash+"'])").css('display', 'none');
  });

  $('#client-posts-discover').on('click', '.discover-overlay', function(e){
    var id = $(this).attr('id');
    var votecard = '#votecard'+id.substring(8);
    if(e.target.parentElement.id == 'client-posts-discover'
    || e.target.parentElement.id.substring(0, 16) == 'overlay-comments'
    || e.target.parentElement.id.substring(0, 8) == 'votecard'){
      $(votecard).css('display', 'none');
    } else{
      return;
    }
  });
}

$('.chatlist-item').click(function(){
  var convIdProfilenameProfileidRoomname = $(this).attr('id').split('^');
  var convId = convIdProfilenameProfileidRoomname[0];
  var profileName = convIdProfilenameProfileidRoomname[1];
  var profileId = convIdProfilenameProfileidRoomname[2];
  var roomName = convIdProfilenameProfileidRoomname[3];
  var type = $(this).attr('value');
  if(type == 'user'){
    $.post('/seen_msg/'+convId);
  } else if(type == 'club'){
    $.post('/seen_clubmsg/'+convId);
  }
  $('.chat-form')
  .append('<input type="hidden" name="convId" value="'+convId+'">')
  .append('<input type="hidden" name="profileId" value="'+profileId+'">')
  .append('<input type="hidden" name="'+type+'" value="'+profileName+'">')
  .append('<input type="hidden" name="roomName" value="'+roomName+'">').submit();
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

function updateMsgsContainerHeight_feedpage(){
  function updateHeight(adjustment){
    if($('.pushmsg').css('display') == 'block'){
      var newMsgHeight = window.innerHeight - 1*remToPx() - 31 - 42 - 35 + adjustment;
      $('#messages_container').height(newMsgHeight);
    } else{
      var newMsgHeight = window.innerHeight - 1*remToPx() - 31 - 42 + adjustment;
      $('#messages_container').height(newMsgHeight);
    }
  }

  if(window.innerWidth > 768){
    updateHeight(-16 -40);
  } else if(window.innerWidth <= 768 && window.innerWidth > 480){
    updateHeight(-16);
    document.getElementById("navbar").style.top = "0px";
  } else if(window.innerWidth <= 480 && window.innerWidth > 360){
    updateHeight(-16);
    document.getElementById("navbar").style.top = "0px";
  } else if(window.innerWidth <= 360){
    updateHeight(-4);
    document.getElementById("navbar").style.top = "0px";
  }
  return $('#messages_container').height();
}

function updateMsgsContainerHeight_profilepage(){
  function updateHeight(navheight,tabheight){
    if($('.pushmsg').css('display') == 'block'){
      var newMsgHeight = window.innerHeight - 1.5*remToPx() - navheight - tabheight - 42 - 35;
      $('#messages_container').height(newMsgHeight);
    } else{
      var newMsgHeight = window.innerHeight - 1.5*remToPx() - navheight - tabheight - 42;
      $('#messages_container').height(newMsgHeight);
    }
  }

  if(window.innerWidth > 768){
    updateHeight(0, 47);
  } else if(window.innerWidth <= 768 && window.innerWidth > 480){
    updateHeight(40 + 16, 47);
    document.getElementById("navbar").style.top = "0px";
  } else if(window.innerWidth <= 480 && window.innerWidth > 360){
    updateHeight(50 + 8 + 8, 52);
    document.getElementById("navbar").style.top = "0px";
  } else if(window.innerWidth <= 360){
    updateHeight(42 + 4, 47);
    document.getElementById("navbar").style.top = "0px";
  }
  return $('#messages_container').height();
}

function dec_height(){
  $('#navbar').addClass('stuck');
  $('#messages_container').animate({scrollTop: $('#messages_container')[0].scrollHeight}, 1000);
  if($('#chatbox-loadingarea').hasClass("chatbox-loadingarea2")){
    updateMsgsContainerHeight_feedpage();
  } else if($('#chatbox-loadingarea').hasClass("chatbox-loadingarea3")){
    updateMsgsContainerHeight_profilepage();
  }
}

$("#myTab").on('click', '.nav-link', function(e){
  if($(this).attr('id') != 'chats-tab'){
    $('#navbar').removeClass('stuck');
  }
});

$('div.btncollapse-div').on("click",".btncollapse", function(e){
  var btn = $(this);
  if(window.innerWidth < 768){
    btn.css('border-image', 'repeating-linear-gradient(to left top, blue, red 20px)');
    setTimeout(function(){
      btn.css('border', '5px solid white');
    }, 500); 
  }
  if(btn.attr('id') == 'drop-info'){
    $('.fa-angle-up').toggleClass('flipped-verticaly');
    if(btn.hasClass('shadow-none')){
      btn.removeClass('shadow-none');
    } else{
      btn.addClass('shadow-none');
    }
  }
});

if((location.pathname == '/help/') || (location.pathname == '/faq')){
  $(".navhelp").addClass('requests-active');
}
if(location.pathname.split('/')[1] == 'chats' || location.pathname.split('/')[1] == 'discover'){
  if(location.pathname.split('/')[1] == 'chats'){
    $('.inbox_count').text($('#chats-notificationCount').attr('value'));
    $("#inbox").addClass('requests-active');

    oldMsgHeightMobile = updateMsgsContainerHeight_feedpage();
    $(window).resize(function(){
      oldMsgHeightMobile = updateMsgsContainerHeight_feedpage() + 35;
    });

    function mobileShowChatsList(){
      if(window.innerWidth < 767){
        if($('#chats-list').hasClass('d-none')){
          $('#chats-list').removeClass('d-none');
        } else{
          $('#chats-list').addClass('d-none');
        }
      }
    }

    $('.chat-settings').click(function(){
      $(this).toggleClass('active');
    });
  }

  var chatList = document.getElementById('chats-list');
  var hammergesture = new Hammer.Manager(chatList);
  hammergesture.add(new Hammer.Pan({direction:Hammer.DIRECTION_HORIZONTAL, threshold:80, pointers: 0}));
  hammergesture.on("panend", function(ev) {
    if(ev.direction == Hammer.DIRECTION_RIGHT && location.pathname.split('/')[1] == 'chats'){
      $('.chats_chevronimg').addClass('anitmate-right');
      window.location.replace($('#chatlist-chevron').attr('href'));
    } else if(ev.direction == Hammer.DIRECTION_LEFT && location.pathname.split('/')[1] == 'discover'){
      $('.chats_chevronimg').addClass('anitmate-left');
      window.location.replace($('#chatlist-chevron').attr('href'));
    }
  });
}

if(location.pathname.split('/').length == 3 && location.pathname.split('/')[1] == 'clubs' && 
  location.pathname.split('/')[2].match(/^[a-fA-F0-9]{24}$/)){
  // Ask for club invite
  if(!$('#memberReq-btn').length && $('#cancelReq-btn').length){
    $('#memberReq-div').addClass("d-none");
  }

  oldMsgHeightMobile = updateMsgsContainerHeight_profilepage();
  $(window).resize(function(){
    oldMsgHeightMobile = updateMsgsContainerHeight_profilepage() + 35;
  });
}

if(location.pathname.split('/').length == 3 && location.pathname.split('/')[1] == 'users' && 
  location.pathname.split('/')[2].match(/^[a-fA-F0-9]{24}$/)){
  
  oldMsgHeightMobile = updateMsgsContainerHeight_profilepage();
  $(window).resize(function(){
    oldMsgHeightMobile = updateMsgsContainerHeight_profilepage() + 35;
  });
}

// Multi line chat input - readjust #messages_container margins and height
oldMsgHeightDesktop = $('#messages_container').height();
$('textarea').on('input', function(){
  if($(this).hasClass('chatinput')){
    this.style.height = 'auto';
    if(this.scrollHeight < 100){
      this.style.height = (this.scrollHeight) + 'px';
      if(window.innerWidth > 768){
        $('#messages_container').css('margin-bottom', (this.scrollHeight + 12) + 'px');
        $('#messages_container').height(oldMsgHeightDesktop - (this.scrollHeight + 5));
      } else if(window.innerWidth <= 768 && window.innerWidth > 480){
        $('#messages_container').css('margin-bottom', (this.scrollHeight + 8) + 'px');
        $('#messages_container').height(oldMsgHeightMobile - (this.scrollHeight + 1));
      } else if(window.innerWidth <= 480 && window.innerWidth > 360){
        $('#messages_container').css('margin-bottom', (this.scrollHeight + 8) + 'px');
        $('#messages_container').height(oldMsgHeightMobile - (this.scrollHeight - 3));
      } else if(window.innerWidth <= 360){
        $('#messages_container').css('margin-bottom', (this.scrollHeight + 8) + 'px');
        $('#messages_container').height(oldMsgHeightMobile - (this.scrollHeight + 1));
      }
    } else{
      this.style.height = 96 + 'px';
      if(window.innerWidth > 768){
        $('#messages_container').css('margin-bottom', (96 + 12) + 'px');
        $('#messages_container').height(oldMsgHeightDesktop - (96 + 5));
      } else if(window.innerWidth <= 768 && window.innerWidth > 480){
        $('#messages_container').css('margin-bottom', (96 + 8) + 'px');
        $('#messages_container').height(oldMsgHeightMobile - (96 + 1));
      } else if(window.innerWidth <= 480 && window.innerWidth > 360){
        $('#messages_container').css('margin-bottom', (96 + 8) + 'px');
        $('#messages_container').height(oldMsgHeightMobile - (96 - 3));
      } else if(window.innerWidth <= 360){
        $('#messages_container').css('margin-bottom', (96 + 8) + 'px');
        $('#messages_container').height(oldMsgHeightMobile - (96 + 1));
      }
    }
  } else{
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  }
});

// Fake Progress bar (Nanobar)
var options = {
  classname: 'meter',
  id: 'bar-id'
};
var nanobar = new Nanobar( options );
nanobar.go(30);
nanobar.go(76);
nanobar.go(100);

//================================================================================
// AJAX
//================================================================================
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
} else if(location.pathname.split('/').length == 2 && location.pathname.split('/')[1] == 'discover'){
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
            $('#like-count'+data.foundPost._id).addClass('d-none');
          }
          else if($('#like-btn'+data.foundPost._id).html() == '<i class="far fa-thumbs-up discover-vote"></i>'
          || $('#heart-btn'+data.foundPost._id).html() == '<i class="fas fa-heart discover-vote redcolor2"></i>'){
            $('#like-btn'+data.foundPost._id).html('<i class="fas fa-thumbs-up discover-vote greencolor"></i>');
            $('#like-count'+data.foundPost._id).removeClass('d-none');
            $('#heart-btn'+data.foundPost._id).html('<i class="far fa-heart discover-vote"></i>');
          }
          $('#like-count'+data.foundPost._id).toggleClass('greencolor2');
          $('#heart-count'+data.foundPost._id).removeClass('redcolor2').addClass('d-none');
        }
        if(formData[1].name == 'heart'){
          if($('#heart-btn'+data.foundPost._id).html() == '<i class="fas fa-heart discover-vote redcolor2"></i>'){
            $('#heart-btn'+data.foundPost._id).html('<i class="far fa-heart discover-vote"></i>');
            $('#heart-count'+data.foundPost._id).addClass('d-none');
          }
          else if($('#heart-btn'+data.foundPost._id).html() == '<i class="far fa-heart discover-vote"></i>'
          || $('#like-btn'+data.foundPost._id).html() == '<i class="fas fa-thumbs-up discover-vote greencolor"></i>'){
            $('#heart-btn'+data.foundPost._id).html('<i class="fas fa-heart discover-vote redcolor2"></i>');
            $('#heart-count'+data.foundPost._id).removeClass('d-none');
            $('#like-btn'+data.foundPost._id).html('<i class="far fa-thumbs-up discover-vote"></i>');
          }
          $('#like-count'+data.foundPost._id).removeClass('greencolor2').addClass('d-none');
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
            $('#like-count'+data.foundPost._id).addClass('d-none');
          }
          else if($('#like-btn'+data.foundPost._id).html() == '<i class="far fa-thumbs-up"></i>'
          || $('#heart-btn'+data.foundPost._id).html() == '<i class="fas fa-heart redcolor2"></i>'){
            $('#like-btn'+data.foundPost._id).html('<i class="fas fa-thumbs-up greencolor"></i>');
            $('#like-count'+data.foundPost._id).removeClass('d-none');
            $('#heart-btn'+data.foundPost._id).html('<i class="far fa-heart"></i>');
          }
          $('#like-count'+data.foundPost._id).toggleClass('greencolor3');
          $('#heart-count'+data.foundPost._id).removeClass('redcolor3').addClass('d-none');
        }
        if(formData[1].name == 'heart'){
          if($('#heart-btn'+data.foundPost._id).html() == '<i class="fas fa-heart redcolor2"></i>'){
            $('#heart-btn'+data.foundPost._id).html('<i class="far fa-heart"></i>');
            $('#heart-count'+data.foundPost._id).addClass('d-none');
          }
          else if($('#heart-btn'+data.foundPost._id).html() == '<i class="far fa-heart"></i>'
          || $('#like-btn'+data.foundPost._id).html() == '<i class="fas fa-thumbs-up greencolor"></i>'){
            $('#heart-btn'+data.foundPost._id).html('<i class="fas fa-heart redcolor2"></i>');
            $('#heart-count'+data.foundPost._id).removeClass('d-none');
            $('#like-btn'+data.foundPost._id).html('<i class="far fa-thumbs-up"></i>');
          }
          $('#like-count'+data.foundPost._id).removeClass('greencolor3').addClass('d-none');
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
        $('#mod-badge'+data.foundPost._id).html('<i class="fas fa-lock-open"></i>');
      }
      if(formData[1].name == 'exclusive'){
        $('#moderation'+data.foundPost._id).removeClass('btn-info').addClass('btn-light').text('Exclusive')
        .attr('name','published').attr('value',0).blur();
        $('#mod-badge'+data.foundPost._id).html('<i class="fas fa-lock"></i>');
      }
      if(formData[1].name == 'visibility'){
        if(formData[1].value == '-1'){
          $('#mod-badge'+data.foundPost._id).removeClass('badge-light').addClass('badge-danger').html('<i class="fas fa-lock"></i>');
          $('#visibility'+data.foundPost._id).text('Visibility (Show)').val('1');
        } else if(formData[1].value == '1'){
          $('#visibility'+data.foundPost._id).text('Visibility (Hide)').val('-1');
          $('#mod-badge'+data.foundPost._id).removeClass('badge-danger').addClass('badge-light').html('<i class="fas fa-eye-slash"></i>');
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
          $('#like-countH'+data.foundPost._id).addClass('d-none');
        }
        else if($('#like-btnH'+data.foundPost._id).html() == '<i class="far fa-thumbs-up"></i>'
        || $('#heart-btnH'+data.foundPost._id).html() == '<i class="fas fa-heart redcolor2"></i>'){
          $('#like-btnH'+data.foundPost._id).html('<i class="fas fa-thumbs-up greencolor"></i>');
          $('#like-countH'+data.foundPost._id).removeClass('d-none');
          $('#heart-btnH'+data.foundPost._id).html('<i class="far fa-heart"></i>');
        }
        $('#like-countH'+data.foundPost._id).toggleClass('greencolor3');
        $('#heart-countH'+data.foundPost._id).removeClass('redcolor3');
      }
      if(formData[1].name == 'heart'){
        if($('#heart-btnH'+data.foundPost._id).html() == '<i class="fas fa-heart redcolor2"></i>'){
          $('#heart-btnH'+data.foundPost._id).html('<i class="far fa-heart"></i>');
          $('#heart-countH'+data.foundPost._id).addClass('d-none');
        }
        else if($('#heart-btnH'+data.foundPost._id).html() == '<i class="far fa-heart"></i>'
        || $('#like-btnH'+data.foundPost._id).html() == '<i class="fas fa-thumbs-up greencolor"></i>'){
          $('#heart-btnH'+data.foundPost._id).html('<i class="fas fa-heart redcolor2"></i>');
          $('#heart-countH'+data.foundPost._id).removeClass('d-none');
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
      $('#comment-up-count'+data.foundComment.comments[0]._id).text(data.foundComment.comments[0].likeCount);
      if($('#comment-up-count'+data.foundComment.comments[0]._id).text() == 0){
        $('#comment-up-count'+data.foundComment.comments[0]._id).addClass('invisible');
      } else{
        $('#comment-up-count'+data.foundComment.comments[0]._id).removeClass('invisible');
      }
      if(formData[1].name == 'commentUp'){
        $('#comment-up-btn'+data.foundComment.comments[0]._id).toggleClass('redcolor2');
        $('#comment-up-count'+data.foundComment.comments[0]._id).toggleClass('redcolor3');
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
        if($('#like-btn'+data.foundClickId.subPosts[0]._id).html() == '<i class="fas fa-thumbs-up vote-subpost2 greencolor"></i>'){
          $('#like-btn'+data.foundClickId.subPosts[0]._id).html('<i class="vote-subpost far fa-thumbs-up vote-subpost2"></i>');
        }
        else if($('#like-btn'+data.foundClickId.subPosts[0]._id).html() == '<i class="vote-subpost far fa-thumbs-up vote-subpost2"></i>'
        || $('#dislike-btn'+data.foundClickId.subPosts[0]._id).html('<i class="fas fa-thumbs-down vote-subpost2 blackcolor"></i>')){
          $('#like-btn'+data.foundClickId.subPosts[0]._id).html('<i class="fas fa-thumbs-up vote-subpost2 greencolor"></i>');
          $('#dislike-btn'+data.foundClickId.subPosts[0]._id).html('<i class="vote-subpost far fa-thumbs-down vote-subpost2"></i>');
        }
        $('#like-count'+data.foundClickId.subPosts[0]._id).toggleClass('greencolor3');
        $('#dislike-count'+data.foundClickId.subPosts[0]._id).removeClass('blackcolor');
      }
      if(formData[1].name == 'subDislike'){
        if($('#dislike-btn'+data.foundClickId.subPosts[0]._id).html() == '<i class="fas fa-thumbs-down vote-subpost2 blackcolor"></i>'){
          $('#dislike-btn'+data.foundClickId.subPosts[0]._id).html('<i class="vote-subpost far fa-thumbs-down vote-subpost2"></i>');
        }
        else if($('#dislike-btn'+data.foundClickId.subPosts[0]._id).html() == '<i class="vote-subpost far fa-thumbs-down vote-subpost2"></i>'
        || $('#like-btn'+data.foundClickId.subPosts[0]._id).html('<i class="fas fa-thumbs-up vote-subpost2 greencolor"></i>')){
          $('#dislike-btn'+data.foundClickId.subPosts[0]._id).html('<i class="fas fa-thumbs-down vote-subpost2 blackcolor"></i>');
          $('#like-btn'+data.foundClickId.subPosts[0]._id).html('<i class="vote-subpost far fa-thumbs-up vote-subpost2"></i>');
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
