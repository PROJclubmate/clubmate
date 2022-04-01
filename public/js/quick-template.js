$('.messMenuOpen').on('click', function (e) {
  const collegeName = $('#quickview_collegename').attr('value');
  $.ajax({
    type: 'GET',
    url: '/colleges/'+collegeName+'/quickmess',
    timeout: 15000
  }).done(function(response){
    let today = new Date();
      const weekDay = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      let Day = weekDay[today.getDay()];

      const dateData = {
        day: Day,
        todayDate: today,
      };
      const menu = response.mess.menu.filter(function (menuItem) {
        return menuItem.day === dateData.day
      });
      const day = dateData.day
      var messName = document.getElementById('messName');
      messName.innerText = `${response.messName}`;
      var quickMessContent = document.getElementById('quickMessContent');
      quickMessContent.innerHTML = quick_mess_template(menu, day);
  }).fail(function(jqXHR, textStatus){
    if(textStatus === 'timeout'){
      $('#quickMessContent').text('Request timed out');
    }
  });

  setTimeout(() => {
    const accItems = document.querySelectorAll('.accordion__item');
    accItems.forEach((acc) => {
      openCurrentMeal();

      acc.addEventListener('click', function (e) {
        accItems.forEach((item) =>
          item != this
            ? item.classList.remove('accordion__item--active')
            : null
        );
        if (this.classList != 'accordion__item--active') {
          this.classList.toggle('accordion__item--active');
        }
      })
    });

    function openCurrentMeal(){
      let tday = new Date();
      let time = tday.getHours();

      accItems.forEach((item) => {
        if (time >= 5 && time < 10) {
          if(item.id.split('-')[1] == 'Breakfast'){
            item.classList.add('accordion__item--active');
          }
        }
        if (time >= 11 && time < 14) {
          if(item.id.split('-')[1] == 'Lunch'){
            item.classList.add('accordion__item--active');
          }
        }
        if (time >= 15 && time < 18) {
          if(item.id.split('-')[1] == 'Snacks'){
            item.classList.add('accordion__item--active');
          }
        }
        if (time >= 19 && time < 22) {
          if(item.id.split('-')[1] == 'Dinner'){
            item.classList.add('accordion__item--active');
          }
        }
      });
    };
  }, 1000);
});

function quick_mess_template(menu, day) {
  html = ejs.render(`
<style>
  .accordion{ max-width: 25rem; border-radius: 1rem; box-shadow: 0 0 5rem lightgrey; }
  .accordion__item:not(:last-child){ border-bottom: 1px solid lightgrey; }
  .accordion__btn{ display: flex; justify-content: space-between; align-items: center; width: 100%;
    padding: 1.2rem 1.4rem; background: white; border: none; outline: none; color: #5f5c70;
    font-size: 1.2rem; text-align: left; cursor: pointer; transition: 0.15s; }
  .accordion__btn:hover{ color: #6a5acd; background: #f4f3fb; }
  .accordion__btn:focus{ outline: none; }
  .accordion__item--active .accordion__btn{ color: #6a5acd; border-bottom: 2px solid #6a5acd; background: #f4f3fb; }
  .accordion__icon{ border-radius: 50%; transform: rotate(0deg); transition: 0.35s ease-in-out; opacity: 0.9; }
  .accordion__item--active .accordion__icon{ transform: rotate(135deg); }
  .accordion__content{ font-weight: 400; font-size: 18px; max-height: 0; opacity: 0; overflow: hidden; 
    color: #5f5c70; transform: translateX(16px); transition: max-height 0.35s ease, opacity 0.35s, transform 0.35s; }
  .accordion__item--active .accordion__content{ opacity: 1; transform: translateX(0px); max-height: 100vh; }
  .container-fluid{ display: flex; justify-content: center; margin-top: 2em; }
  .menu{ width: 25em; }
</style>

<div class="container">
  <div class="row justify-content-center">
    <div class="col-md-8 col-lg-9">
      <div class="container-fluid mx-auto my-0">
        <div class="menu">
          <div class="accordion py-3 bg-white">
            <h2 class="accordion__heading mb-3 px-4 text-center">
                <%= day %>
            </h2>
            <% for(let menuItem of menu) { %> 
              <div id="item-<%= menuItem.time %>" class="accordion__item">
                <button class="accordion__btn">
                  <span class="accordion__caption">
                  <i class="fas fa-utensils mr-3 text-xxl darkgrey"></i>
                      <%= menuItem.time %>
                  </span>
                  <span class="accordion__icon"><i class="fa fa-plus"></i></span>
                </button>
                <div class="accordion__content">
                  <ul class="list-group list-group-flush py-3 px-4">
                    <% for(let dish of menuItem.dishes) { %>
                      <li class="list-group-item">
                        <%= dish %>
                      </li>
                    <% } %>
                  </ul>
                </div>
              </div>
            <% } %>                           
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`, { menu, day });
  return html;
}