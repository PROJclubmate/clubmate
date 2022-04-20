const accItems = document.querySelectorAll(".accordion__item");
accItems.forEach((acc) =>
  acc.addEventListener("click", function (e) {
    accItems.forEach((item) =>
      item != this
        ? item.classList.remove("accordion__item--active")
        : null
    );
    if (this.classList != "accordion__item--active") {
      this.classList.toggle("accordion__item--active");
    }
  })
);

var slide = document.getElementsByClassName("slide");
var indicator = document.getElementById("indicator");
var dots = document.getElementsByClassName("dots");
var l = slide.length;
var interval = 5000;
var set;

for (let s of slide) {
  s.classList.add("d-none");
}

let tday = new Date();
let nslide = 0;
let time = tday.getHours();
switch (tday.getDay()) {
  case 0:
    nslide = 6;
    break;
  case 1:
    nslide = 0;
    break;
  case 2:
    nslide = 1;
    break;
  case 3:
    nslide = 2;
    break;
  case 4:
    nslide = 3;
    break;
  case 5:
    nslide = 4;
    break;
  case 6:
    nslide = 5;
    break;
}

window.onload = function () {
  if(slide.length){
    slide[nslide].style.opacity = "1";
    slide[nslide].classList.remove("d-none");
    for (var j = 0; j < l; j++) {
      indicator.innerHTML +=
        "<div class='dots' onclick=change(" + j + ")></div>";
    }
    dots[nslide].style.background = "rgba(0,0,0,0.5)";
  }

  populateInputFields();
  $('select.editmess_select').on('change', function() {
    populateInputFields();
  });
};

function populateInputFields(){
  let divelement = document.getElementById('dishes_inputs');
  divelement.innerHTML = '';
  populateOneField('', divelement);
  
  let mess = $('select#mess').val();
  let day = $('select#day').val();
  let time = $('select#time').val();

  for(let i=0; i < foundMess.mess.length; i++){
    if(foundMess.mess[i].name == mess){
      for(let j=0; j < foundMess.mess[i].menu.length; j++){
        if(foundMess.mess[i].menu[j].day == day && foundMess.mess[i].menu[j].time == time){
          for(let k=foundMess.mess[i].menu[j].dishes.length-1; k >= 0; k--){
            populateOneField(foundMess.mess[i].menu[j].dishes[k], divelement);
          }
        }
      }
    }
  }
}

function populateOneField(value, divelement){
  let input = document.createElement('input');
  input.setAttribute('type', 'text');
  input.classList.add('form-control', 'info-form');
  input.setAttribute('name', 'dishes');
  input.setAttribute('placeholder', '');
  input.setAttribute('value', value);
  divelement.prepend(input);
}

function change(index) {
  clearInterval(set);
  count = index;
  for (var j = 0; j < l; j++) {
    slide[j].style.opacity = "0";
    slide[j].classList.add("d-none");
    dots[j].style.background = "rgba(0,0,0,0.15)";
  }
  slide[count].style.opacity = "1";
  slide[count].classList.remove("d-none");
  dots[count].style.background = "rgba(0,0,0,0.5)";
}

var count = nslide;
function next() {
  clearInterval(set);
  slide[count].style.opacity = "0";
  slide[count].classList.add("d-none");
  count++;
  for (var j = 0; j < l; j++) {
    dots[j].style.background = "rgba(0,0,0,0.15)";
  }

  if (count == l) {
    count = 0;
    slide[count].style.opacity = "1";
    slide[count].classList.remove("d-none");
    dots[count].style.background = "rgba(0,0,0,0.5)";
  } else {
    slide[count].style.opacity = "1";
    slide[count].classList.remove("d-none");
    dots[count].style.background = "rgba(0,0,0,0.5)";
  }
}

function prev() {
  clearInterval(set);
  slide[count].style.opacity = "0";
  slide[count].classList.add("d-none");
  for (var j = 0; j < l; j++) {
    dots[j].style.background = "rgba(0,0,0,0.15)";
  }
  count--;

  if (count == -1) {
    count = l - 1;
    slide[count].style.opacity = "1";
    slide[count].classList.remove("d-none");
    dots[count].style.background = "rgba(0,0,0,0.5)";
  } else {
    slide[count].style.opacity = "1";
    slide[count].classList.remove("d-none");
    dots[count].style.background = "rgba(0,0,0,0.5)";
  }
}