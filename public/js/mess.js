// const width =
//   window.innerWidth ||
//   document.documentElement.clientWidth ||
//   document.body.clientWidth;

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
  slide[nslide].style.opacity = "1";
  slide[nslide].classList.remove("d-none");
  for (var j = 0; j < l; j++) {
    indicator.innerHTML +=
      "<div class='dots' onclick=change(" + j + ")></div>";
  }

  dots[nslide].style.background = "#696969";
};

// if (time >= 5 && time <= 10) {
//   accItems[nslide * 4 + 0].classList.add("accordion__item--active");
// }
// if (time >= 11 && time <= 13) {
//   accItems[nslide * 4 + 1].classList.add("accordion__item--active");
// }
// if (time >= 16 && time <= 18) {
//   accItems[nslide * 4 + 2].classList.add("accordion__item--active");
// }
// if (time >= 19 && time <= 22) {
//   accItems[nslide * 4 + 3].classList.add("accordion__item--active");
// }

function change(index) {
  clearInterval(set);
  count = index;
  for (var j = 0; j < l; j++) {
    slide[j].style.opacity = "0";
    slide[j].classList.add("d-none");
    dots[j].style.background = "#bdbdbd";
  }
  slide[count].style.opacity = "1";
  slide[count].classList.remove("d-none");
  dots[count].style.background = "#696969";
}

var count = nslide;
function next() {
  clearInterval(set);
  slide[count].style.opacity = "0";
  slide[count].classList.add("d-none");
  count++;
  for (var j = 0; j < l; j++) {
    dots[j].style.background = "#bdbdbd";
  }

  if (count == l) {
    count = 0;
    slide[count].style.opacity = "1";
    slide[count].classList.remove("d-none");
    dots[count].style.background = "#696969";
  } else {
    slide[count].style.opacity = "1";
    slide[count].classList.remove("d-none");
    dots[count].style.background = "#696969";
  }
}

function prev() {
  clearInterval(set);
  slide[count].style.opacity = "0";
  slide[count].classList.add("d-none");
  for (var j = 0; j < l; j++) {
    dots[j].style.background = "#bdbdbd";
  }
  count--;

  if (count == -1) {
    count = l - 1;
    slide[count].style.opacity = "1";
    slide[count].classList.remove("d-none");
    dots[count].style.background = "#696969";
  } else {
    slide[count].style.opacity = "1";
    slide[count].classList.remove("d-none");
    dots[count].style.background = "#696969";
  }
}
