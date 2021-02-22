
jQuery('<div class="quantity-nav"><div class="quantity-button quantity-up">+</div><div class="quantity-button quantity-down">-</div></div>').insertAfter('.quantity input');
jQuery('.quantity').each(function (index) {
  var spinner = jQuery(this),
    input = spinner.find('input[type="number"]'),
    btnUp = spinner.find('.quantity-up'),
    btnDown = spinner.find('.quantity-down'),
    min = input.attr('min'),
    max = input.attr('max');

  btnUp.click(function () {
    var oldValue = parseFloat(input.val());
    if (oldValue >= max) {
      var newVal = oldValue;
    } else {
      var newVal = oldValue + 1;
    }

    spinner.find("input").val(newVal);
    updateHiddenInput(index,newVal);
    updatePosition(index);
    spinner.find("input").trigger("change");
  });

  btnDown.click(function () {
    var oldValue = parseFloat(input.val());
    if (oldValue <= min) {
      var newVal = oldValue;
    } else {
      var newVal = oldValue - 1;
    }
    spinner.find("input").val(newVal);
    updateHiddenInput(index,newVal);
    updatePosition(index);
    spinner.find("input").trigger("change");
  });

});

function updateHiddenInput(index,newVal){
  let hiddenInput = document.getElementsByClassName('positionHiddenInput')[index];
  hiddenInput.value = newVal;

}

function updatePosition(index) {
  let inputQtd = document.getElementsByClassName("posicao-input")[index];
  let currentPrice = document.getElementsByClassName("ticker-current-price")[index];
  let posicao = document.getElementsByClassName("ticker-posicao")[index];

  let positionUn = parseInt(inputQtd.value);
  let position = (positionUn * parseFloat(currentPrice.innerHTML)).toFixed(
    2
  );
  posicao.innerHTML = position;

}

