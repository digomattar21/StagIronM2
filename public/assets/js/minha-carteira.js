let inputQtd = document.getElementsByClassName("posicao-input");
let currentPrice = document.getElementsByClassName("ticker-current-price");
let posicao = document.getElementsByClassName("ticker-posicao");

for (let i = 0; i < inputQtd.length; i++) {
  inputQtd[i].addEventListener("change", function (e) {
    let positionUn = parseInt(inputQtd[i].value);
    let position = (positionUn * parseFloat(currentPrice[i].innerHTML)).toFixed(
      2
    );
    posicao[i].innerHTML = position;
  });
}

jQuery('<div class="quantity-nav"><div class="quantity-button quantity-up">+</div><div class="quantity-button quantity-down">-</div></div>').insertAfter('.quantity input');
jQuery('.quantity').each(function() {
  var spinner = jQuery(this),
    input = spinner.find('input[type="number"]'),
    btnUp = spinner.find('.quantity-up'),
    btnDown = spinner.find('.quantity-down'),
    min = input.attr('min'),
    max = input.attr('max');

  btnUp.click(function() {
    var oldValue = parseFloat(input.val());
    if (oldValue >= max) {
      var newVal = oldValue;
    } else {
      var newVal = oldValue + 1;
    }
    spinner.find("input").val(newVal);
    spinner.find("input").trigger("change");
  });

  btnDown.click(function() {
    var oldValue = parseFloat(input.val());
    if (oldValue <= min) {
      var newVal = oldValue;
    } else {
      var newVal = oldValue - 1;
    }
    spinner.find("input").val(newVal);
    spinner.find("input").trigger("change");
  });

});