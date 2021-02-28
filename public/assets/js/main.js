function carouselZoomOnHover() {
  let carouselTextDiv1 = document.getElementById('car1-text-container');
  let carouselTextDiv2 = document.getElementById('car2-text-container');
  let carouselTextDiv3 = document.getElementById('car3-text-container');

  let carImg1 = document.getElementById('car1-img');
  let carImg2 = document.getElementById('car2-img');
  let carImg3 = document.getElementById('car3-img');


  carouselTextDiv1.addEventListener('mouseover', function (e) {
    carImg1.style.transition = 'transform .5s';
    carImg1.style.transform = 'scale(1.3)';
  });

  carouselTextDiv2.addEventListener('mouseover', function (e) {
    carImg2.style.transition = 'transform .5s';
    carImg2.style.transform = 'scale(1.3)';
  })

  carouselTextDiv3.addEventListener('mouseover', function (e) {
    carImg3.style.transition = 'transform .5s';
    carImg3.style.transform = 'scale(1.3)';
  })

}

$(document).ready(function () {
  $('.dropright button').on("click", function (e) {
    e.stopPropagation();
    e.preventDefault();



    if (!$(this).next('div').hasClass('show')) {
      $(this).next('div').addClass('show');
    } else {
      $(this).next('div').removeClass('show');
    }

  });
});

setInterval(carouselZoomOnHover, 50);




