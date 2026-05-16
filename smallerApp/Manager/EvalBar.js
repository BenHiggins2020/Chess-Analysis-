
const evalBar = document.getElementById('progress-bar')
const cpValue = document.getElementById("cp-value");
// evalBar.style.width = 50;
const TAG = 'EvalBar: '

export function updateEval(prev_cp, cp) {
    console.log(TAG + `updateEval : eval before ${prev_cp}, eval after: ${cp}, loss = ${cp - prev_cp}`)
    // evalBar.classList.remove('positive', 'negative');
    let currentWidth = parseInt(getComputedStyle(evalBar).width);
    if (cp > 0) {
        // evalBar.classList.add('positive');
        // evalBar.style.width = currentWidth += cp;
    } else {
        // evalBar.classList.add('negative');

    }
    let value = cp.toString();
    console.log(TAG + `got CP: ${cp} , cp tostring: ${typeof value}`)
    evalBar.value = evalBar.value += cp;
    cpValue.textContent = value

}