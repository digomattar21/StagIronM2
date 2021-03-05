
async function calculateDCF() {
    try {
        console.log('entrou')
        let ebit = document.getElementById('ebit-input').value;
        let incidenciaIr = document.getElementById('incidencia-ir-input').value;
        let nopat = document.getElementById('nopat')
        if (ebit && incidenciaIr) {
            ebit = parseFloat(ebit);
            incidenciaIr = parseFloat(incidenciaIr);
            if (incidenciaIr > 1) {
                incidenciaIr = incidenciaIr / 100
            }
            var nopatCalc = (ebit - (ebit * incidenciaIr));
            nopat.value = nopatCalc
        }

        let depamort = document.getElementById('depamort-input').value;
        var ebtida = document.getElementById('ebitda');

        if (depamort && ebit && incidenciaIr) {
            depamort = parseFloat(depamort);
            var ebitdaCalc = nopatCalc+depamort
            ebitda.value=ebitdaCalc
        }

        var capex = document.getElementById('capex-input').value;
        var ncg = document.getElementById('ncg-input').value;
        var fcff = document.getElementById('fcff')

        if (capex && ncg && depamort && incidenciaIr && ebit) {
            capex = parseFloat(capex);
            ncg = parseFloat(ncg);
            var fcffCalc = ebitdaCalc - capex - ncg;
            fcff.value=fcffCalc
        }

        var txCresc = document.getElementById('tx-cresc-input').value;
        var txDesc = document.getElementById('tx-desc-input').value;
        var sharesOuts = document.getElementById('shares-outs-input').value;
        var ppa = document.getElementById('ppa')

        if (capex && ncg && depamort && incidenciaIr && ebit && txCresc && txDesc && sharesOuts){
            txCresc = parseFloat(txCresc);
            txDesc = parseFloat(txDesc);
            sharesOuts = parseFloat(sharesOuts);

            if (txCresc>1){
                txCresc =txCresc/100;
            }

            if (txDesc>1){
                txDesc =txDesc/100;
            }

            var valorIntrinseco = Math.round((fcffCalc*(1+txCresc))/(txDesc-txCresc));

            var ppaCalc = valorIntrinseco/sharesOuts;
            ppa.value=ppaCalc;
        }


    }
    catch (err) {
        console.log(err)
    }
}


setInterval(calculateDCF,100)




