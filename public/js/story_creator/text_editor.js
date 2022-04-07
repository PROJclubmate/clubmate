// TEXT EDITOR
// Load our code - we're putting it all into a function so we can use diff templates in diff situations
WebFont.load({
  google: {
    families: ['Open Sans:400,800']
  },
  active: function() {
    var canvas = initCanvas('story-maker');
    addTextBoxTemplate(canvas);
    
    
    // Randomize text & background colors
    document.getElementById('color').onchange = function() {
      let res = document.getElementById('result');
      res.style.backgroundColor = this.value;
      res.style.color = niceColor(res.style.backgroundColor);

      document.getElementById('story-draftimg').setAttribute('is_edited', 'true');
      document.getElementById('story-draftimg').setAttribute('background_color', res.style.backgroundColor);
      document.getElementById('story-draftimg').setAttribute('text_color', res.style.color);

      canvas.backgroundColor = res.style.backgroundColor;
      canvas.item(0).set("fill", res.style.color);
      canvas.item(0).enterEditing();
      canvas.item(0).hiddenTextarea.focus();
      canvas.renderAll();
    };


    var addTextBoxBtn = document.getElementById('addtextbox');
    addTextBoxBtn.addEventListener('click', function(e){
      if(addTextBoxBtn.classList.contains('active')){
        addTextBoxBtn.innerHTML = '<i class="fas fa-font"></i>';
        clearCanvasTemplate(canvas);
        addTextBoxBtn.classList.remove('active');
        nextBtnStatus()
      } else{
        addTextBoxBtn.innerHTML = '<i class="fas fa-eraser"></i>';
        addTextBoxTemplate(canvas);
        addTextBoxBtn.classList.add('active');
        canvas.setActiveObject(canvas.item(0));
        canvas.item(0).enterEditing();
      }
    });

    // Disabling Next > button on basis of textBox value
    canvas.on({'text:changed': nextBtnStatus});

    function nextBtnStatus(){
      if(canvas.item(0)){
        document.getElementById('story-draftimg').setAttribute('text_content', canvas.item(0).text);
        if(canvas.item(0).text == ''){
          document.getElementById('story-maker-next').classList.add('inactive');
        } else{
          document.getElementById('story-maker-next').classList.remove('inactive');
        }
      } else{
        document.getElementById('story-draftimg').setAttribute('text_content', '');
        document.getElementById('story-maker-next').classList.add('inactive');
      }

      document.getElementById('story-draftimg').setAttribute('is_edited', 'true');
    }

    var cropCanvasBtn = document.getElementById('cropcanvas');
    cropCanvasBtn.addEventListener('click', function(e){
      if(cropCanvasBtn.classList.contains('active')){
        document.getElementById('story-maker-next').classList.remove('d-none');
        document.getElementById('story-footer').classList.add('d-none');
        cropCanvasBtn.classList.remove('active');
      } else{
        document.getElementById('story-maker-next').classList.add('d-none');
        document.getElementById('story-footer').classList.remove('d-none');
        cropCanvasBtn.classList.add('active');

        // Select option - what Aspect Ratio to crop
        var cropCanvasOptions = document.getElementsByClassName('crop-canvas-options');
        var selectAspectRatio = function() {
          var aspectRatio = this.id;
          document.getElementById('story-draftimg').setAttribute('is_edited', 'true');
          cropCanvasTemplate(canvas, aspectRatio);
          setTimeout(function(){ 
            document.getElementById('story-maker-next').classList.remove('d-none');
            document.getElementById('story-footer').classList.add('d-none');
          }, 1000);
          cropCanvasBtn.classList.remove('active');
        };
        for (var i=0;i<cropCanvasOptions.length;i++) {
          cropCanvasOptions[i].addEventListener('click', selectAspectRatio, false);
        }
      }
    });

    // Save image
    var link = document.getElementById('saveimage');   
    link.addEventListener('click', function(ev) {
      var imgData = canvas.toDataURL({format:'jpeg', quality: 1, multiplier: 3});
      // var strDataURI = imgData.substr(22, imgData.length);
      var blob = dataURLtoBlob(imgData);
      var objurl = URL.createObjectURL(blob);
      link.download = 'story.jpg';
      link.href = objurl;
    });

    // Upload Draft image, move to step 2 - options
    var nextBtn = document.getElementById('story-maker-next');   
    nextBtn.addEventListener('click', function(ev) {
      var nextBtn = document.getElementById('story-maker-next');
      if(!nextBtn.classList.contains('inactive')){
        if(document.getElementById('story-draftimg').getAttribute('is_edited') == 'false'){
          return location.replace('/clubs/'+ nextBtn.getAttribute('club-id') +'/story/create/options');
        } else{
          var imgData = canvas.toDataURL({format:'webp', quality: 1, multiplier: 3});
          var type = 'text';
          var textContent = document.getElementById('story-draftimg').getAttribute('text_content');
          var backgroundColor = document.getElementById('story-draftimg').getAttribute('background_color');
          var textColor = document.getElementById('story-draftimg').getAttribute('text_color');
          var aspectRatio = document.getElementById('story-draftimg').getAttribute('aspect_ratio');
          var clubId = nextBtn.getAttribute('club-id');
          var csrfToken = nextBtn.getAttribute('csrf-token');
          sendImageDraftToServer(imgData, type, textContent, backgroundColor, textColor, aspectRatio, clubId, csrfToken);
        }
      }
    });
  }
});

var initCanvas = (id) => {
  // Set custom canvas resolution for different aspect ratio
  var storyMaker = document.getElementById("story-maker"), ctx = storyMaker.getContext("2d");
  var storyMakerContainerWidth = document.getElementById("story-maker-container").clientWidth;
  var storyMakerContainerHeight = document.getElementById("story-maker-container").offsetHeight;
  storyMaker.style['border'] = '2px solid red';

  // Absolute positioning of canvas at the center of screen such that there is space for controls at top & bottom
  if(window.outerWidth > 768){
    storyMaker.width = 0.625*window.outerHeight;
    storyMaker.height = 0.625*window.outerHeight;
    var storyMakerMarginText = (storyMakerContainerHeight - storyMaker.offsetHeight)/2 + 'px '
    + (storyMakerContainerWidth - storyMaker.clientWidth)/2 + 'px';
    storyMaker.style['margin'] = storyMakerMarginText;
  } else if(window.outerWidth <= 768 && window.outerWidth > 480){
    storyMaker.width = 0.625*window.outerWidth;
    storyMaker.height = 0.625*window.outerWidth;
    var storyMakerMarginText = (storyMakerContainerHeight - storyMaker.offsetHeight)/2 + 'px '
    + (storyMakerContainerWidth - storyMaker.clientWidth)/2 + 'px';
    storyMaker.style['margin'] = storyMakerMarginText;
  } else if(window.outerWidth <= 480){
    storyMaker.width = window.outerWidth;
    storyMaker.height = window.outerWidth;
    var storyMakerMarginText = (storyMakerContainerHeight - storyMaker.offsetHeight)/2 + 'px '
    + (storyMakerContainerWidth - storyMaker.clientWidth)/2 + 'px';
    storyMaker.style['margin'] = storyMakerMarginText;
  }

  // Make canvas a fabric canvas
  return new fabric.Canvas(id, {preserveObjectStacking: true});
}


function cropCanvasTemplate(canvas, aspectRatio) {
  document.getElementById('story-draftimg').setAttribute('aspect_ratio', aspectRatio);
  
  var x = Number(aspectRatio.split('_')[0]);
  var y = Number(aspectRatio.split('_')[1]);
  if((x == 4 && y == 3) || (x == 1 && y == 1) || (x == 3 && y == 4) || (x == 9 && y == 16)){
    var storyMaker = document.getElementById("story-maker");
    // BUG?!    ------------------>    Haven't checked yet, (- 4) adjustment is for 2px border
    var storyMakerContainerWidth = document.getElementById("story-maker-container").clientWidth - 4;
    var storyMakerContainerHeight = document.getElementById("story-maker-container").offsetHeight - 4;

    if(window.outerWidth > 768){
      canvas.setWidth((x/y)*0.625*window.outerHeight);
      canvas.setHeight(0.625*window.outerHeight);
      cropCanvasAndCenterText()
    } else if(window.outerWidth <= 768 && window.outerWidth > 480){
      if((x == 3 && y == 4)){
        canvas.setWidth(0.75*0.625*window.outerWidth);
        canvas.setHeight(0.75*0.625*(y/x)*window.outerWidth);
      } else if(x == 9 && y == 16){
        canvas.setWidth(0.5*0.625*window.outerWidth);
        canvas.setHeight(0.5*0.625*(y/x)*window.outerWidth);
      } else{
        canvas.setWidth(0.625*window.outerWidth);
        canvas.setHeight(0.625*(y/x)*window.outerWidth);
      }
      cropCanvasAndCenterText()
    } else if(window.outerWidth <= 480){
      if((x == 3 && y == 4)){
        canvas.setWidth(0.75*window.outerWidth);
        canvas.setHeight(0.75*(y/x)*window.outerWidth);
      } else if(x == 9 && y == 16){
        canvas.setWidth(0.625*window.outerWidth);
        canvas.setHeight(0.625*(y/x)*window.outerWidth);
      } else{
        canvas.setWidth(window.outerWidth);
        canvas.setHeight((y/x)*window.outerWidth);
      }
      cropCanvasAndCenterText()
    }

    function cropCanvasAndCenterText() {
      var storyMakerMarginText = (storyMakerContainerHeight - storyMaker.offsetHeight)/2 + 'px '
      + (storyMakerContainerWidth - storyMaker.clientWidth)/2 + 'px';
      document.getElementsByClassName("upper-canvas")[0].style['margin'] = storyMakerMarginText;
      document.getElementsByClassName("lower-canvas")[0].style['margin'] = storyMakerMarginText;
      var canvCenter = canvas.getCenter();
      if(canvas.item(0)){
        var textboxObj = canvas.item(0);
        textboxObj.left = canvCenter.left;
        textboxObj.top = canvCenter.top;
      }
      fitTextToCanvas(canvas)
      canvas.requestRenderAll();
    }
  }
}

function fitTextToCanvas(canvas) {
  if(canvas.item(0)){
    var textboxObj = canvas.item(0);
    var textWidth = textboxObj.width;
    var textHeight = textboxObj.height;
    var canvasWidth = canvas.getWidth();
    var canvasHeight = canvas.getHeight();

    var textRatio = textWidth / textHeight;
    var canvasRatio = canvasWidth / canvasHeight;
    if(textRatio <= canvasRatio){
      textboxObj.scaleToWidth(canvasWidth);
      textboxObj.scaleToHeight(canvasHeight);
    }else{
      textboxObj.scaleToHeight(canvasHeight);
      textboxObj.scaleToWidth(canvasWidth);
    }
    canvas.item(0).enterEditing();
    canvas.item(0).hiddenTextarea.focus();
  }
}

function addTextBoxTemplate(canvas) {
  var canvCenter = canvas.getCenter();
  var draftBackColor = document.getElementById('story-draftimg').getAttribute('background_color') || 'black';
  var draftTextColor = document.getElementById('story-draftimg').getAttribute('text_color') || 'white';
  canvas.backgroundColor = draftBackColor;

  var draftText = document.getElementById('story-draftimg').getAttribute('text_content') || '';
  if(draftText != ''){
    document.getElementById('story-maker-next').classList.remove('inactive');
  }
  // Load text onto canvas
  var textboxObj = new fabric.Textbox(draftText, {
    id: 'textboxObj',
    left: canvCenter.left,
    top: canvCenter.top,
    originX: 'center',
    originY: 'center',
    width: 0.75*canvas.width,
    fontSize: 28,
    fill: draftTextColor,
    fontFamily: 'Open Sans',
    fontWeight: 800,
    textAlign: 'center',      
    borderColor: '#06538e',
    padding: 4,
    cornerSize: 12,
    transparentCorners: false,
    lockRotation: true
  });
  textboxObj.setSelectionStart(textboxObj.text.length);
  textboxObj.setSelectionEnd(textboxObj.text.length);
  textboxObj.setControlsVisibility({
    mtr: false, 
  });
  canvas.add(textboxObj);
  cropCanvasTemplate(canvas, document.getElementById('story-draftimg').getAttribute('aspect_ratio'));


  document.getElementById('addtextbox').innerHTML = '<i class="fas fa-eraser"></i>';
  document.getElementById('addtextbox').classList.add('active');
  canvas.setActiveObject(canvas.item(0));
  canvas.item(0).enterEditing();
  canvas.item(0).hiddenTextarea.focus();
}

function clearCanvasTemplate(canvas) {
  canvas.remove(canvas.item(0));
}

// dataURLtoBlob function for saving
function dataURLtoBlob(dataurl) {
  var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--){
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], {type:mime});
}

//Sending image data to server
function sendImageDraftToServer(imgData, type, textContent, backgroundColor, textColor, aspectRatio, clubId, csrfToken){
  var xhr = new XMLHttpRequest();
  xhr.open("POST", '/clubs/'+ clubId +'/story/create/draft', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('X-CSRF-Token', csrfToken);
  xhr.send(JSON.stringify({image: imgData, type, textContent, backgroundColor, textColor, aspectRatio}));
  xhr.onloadend = function() {
    if(xhr.status == 200) {
      return location.replace('/clubs/'+ clubId +'/story/create/options');
    }
  }
}

// NICE COLOR PAIR GENREATOR

function niceColor(clr) {
	let hsl = rgb2hsl(clr);
  hsl[0] = (hsl[0]+0.5) % 1;
  hsl[1] = (hsl[1]+0.5) % 1;
  hsl[2] = (hsl[2]+0.5) % 1;
  return 'hsl('+(hsl[0]*360)+','+(hsl[1]*100)+'%,'+(hsl[2]*100)+'%)';
}

document.getElementById('randomcolor').onclick = function() {
  let color = document.getElementById('color');
  color.value = randomHex();
  color.onchange();
};

// random borrowed from https://codepen.io/rhymes/pen/VXJabv
function randomColorVal() {
  // Should be 0 to 255 inclusive
  return Math.floor((Math.random() * 256));
}
function toHex(intVal) {
  let hex = intVal.toString(16);
  if (hex.length === 1){
    hex = '0' + hex;
  }
  return hex;
}
function hexFromInts(r, g, b){
  return '#' + toHex(r) + toHex(g) + toHex(b);
}
function randomHex() {
  let r = randomColorVal();
  let g = randomColorVal();
  let b = randomColorVal();
  return hexFromInts(r, g, b);
}

function rgb2hsl(clr) {
	let rgb = clr.substring(4, clr.length-1).replace(/ /g, '').split(',');
  return rgbToHsl(rgb[0],rgb[1],rgb[2]);
}

// https://gist.github.com/mjackson/5311256
function rgbToHsl(r, g, b) {
  r /= 255, g /= 255, b /= 255;

  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  return [ h, s, l ];
}