// const $container = document.querySelector('#grid-container')

// let zoom = 1.0;
// let offsetX = -0.5; // Смещение по X
// let offsetY = 0;    // Смещение по Y
// const steps = 100;

// function mondelbroteNums(ca, cb, itt) {

//   let a = 0;
//   let b = 0;
//   let a2 = 0; // a*a
//   let b2 = 0; // b*b

//   for (let i = 0; i < itt; i++) {
//       // Основная формула
//       b = 2 * a * b + cb;
//       a = a2 - b2 + ca;
        
//       a2 = a * a;
//       b2 = b * b;

//       // Проверка на выход за границу 
//       if (a2 + b2 > 4) {
//         const wave = Math.sin(i  * 0.25) 
//         const hue = 240 + wave * 60
//         const lightness = 40 + (i % 20)


//         return `hsl(${hue}, 80%, ${lightness}%)`
//       }
//   }
//   return 'rgb(10, 10, 10)';
// }


// function render() {
//   $container.innerHTML = ''

//   for (let j = steps - 1; j >= -steps; j--) {
//     for (let i = -2 * steps; i < steps; i++) {
      
//       const square = document.createElement('div')
//       square.className = 'square'
      
//       const indexX = ((i + 0.1) / steps).toFixed(2)
//       const indexY = ((j + 0.1) / steps).toFixed(2)
      
//       square.style.backgroundColor = mondelbroteNums(+indexX * zoom + offsetX, +indexY * zoom + offsetY, 100)
      
//       $container.appendChild(square)
//     }
//   }
// }

// window.addEventListener('keydown', (e) => {
//     const moveStep = 0.1 * zoom; // Скорость движения зависит от зума
    
//     switch(e.key) {
//         case '+': case '=': zoom *= 0.8; break; // Приближение
//         case '-': case '_': zoom *= 1.25; break; // Отдаление
//         case 'ArrowUp':    offsetY += moveStep; break;
//         case 'ArrowDown':  offsetY -= moveStep; break;
//         case 'ArrowLeft':  offsetX -= moveStep; break;
//         case 'ArrowRight': offsetX += moveStep; break;
//     }
//     render(); // Перерисовываем
// });

// render()




const $canvas = document.querySelector('#canvas')
const $zoomInfo = document.querySelector('#zoom-info')
const $screenshotBtn = document.querySelector('#screenshotBtn')
const $mandelbrotBtn = document.querySelector('#mandelbrot')
const $juliaBtn = document.querySelector('#julia')
const $animateBtn = document.querySelector('#animateBtn')

const ctx = $canvas.getContext('2d')

let zoom = 1
let initialPinchDist = null;
let offsetX = -0.2
let offsetY = 0

let c = [0, 1]
let isJulia = false
let isJuliaAnimated = false

const maxItt = 100

let time1 = 0
let time2 = 0
let isAnimated = true

function mandelbrot(x0, y0) {
  let x = x0, y = y0, x2 = 0, y2 = 0, i = 0
  while (x2 + y2 <= 4 && i < maxItt) {
    x2 = x**2
    y2 = y**2
    y = 2*x*y + y0
    x = x2 - y2 + x0
    i++
  }
  return i
}
function julia(x0, y0) {
  let x = x0, y = y0, x2 = 0, y2 = 0, i = 0
  while (x2 + y2 <= 4 && i < maxItt) {
    x2 = x**2
    y2 = y**2
    y = 2*x*y + c[1]
    x = x2 - y2 + c[0]
    i++
  }
  return i
}

function render() {
    const width = $canvas.width
    const height = $canvas.height
    
    // ВАЖНО: Создаем в оперативной памяти пустой массив пикселей размером с наш холст.
    const imageData = ctx.createImageData(width, height)
    const data = imageData.data  // Ссылка на сами данные


    // Проходим по каждому пикселю экрана построчно
    for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
            
            // 1. ПРЕОБРАЗОВАНИЕ КООРДИНАТ ПИКСЕЛЕЙ В СИСТЕМУ КООРДИНАТ СНОЖЕСТВА:
            const indexX = (px / width) * 3 - 2
            const indexY = (py / height) * 2 - 1

            // 2. ПРИМЕНЕНИЕ ЗУМА И СМЕЩЕНИЯ:
            const x0 = indexX * zoom + offsetX
            const y0 = indexY * zoom + offsetY

            // 3. САМА МАТЕМАТИКА МАНДЕЛЬБРОТА (ЯДРО):
            let i = isJulia ? julia(x0, y0) : mandelbrot(x0, y0)

            // 4. ОПРЕДЕЛЕНИЕ ИНДЕКСА В МАССИВЕ БАЙТОВ:
            // Индекс пикселя (x, y) вычисляется как: (длина пройденных строк + оставшаяся) * 4 компонента
            const pixelIndex = (py * width + px) * 4

            // 5. РАСКРАСКА (ЛЮБИМОЕ):
            if (i === maxItt) {
                // Если мы достигли лимита, значит точка внутри фрактала
                data[pixelIndex]     = 0 // Red
                data[pixelIndex + 1] = 0 // Green
                data[pixelIndex + 2] = 0 // Blue
            } else {
                // Если точка улетела, красим её в зависимости от того, как быстро это случилось (i)
                // Используем синусы (АААА СИНУСЫ) с разной фазой для создания плавных переливов
                data[pixelIndex]     = Math.floor(127 + 127 * Math.sin(i * 0.1 + time1))      // Красный
                data[pixelIndex + 1] = Math.floor(127 + 127 * Math.sin(i * 0.13 + 1 + time1))  // Зеленый
                data[pixelIndex + 2] = Math.floor(127 + 127 * Math.sin(i * 0.13 + 2 + time1))  // Синий
            }
            data[pixelIndex + 3] = 255  // не прозрачные
        }
    }
    // Когда весь массив заполнен вытаскиваем из памяти на видеокарту
    ctx.putImageData(imageData, 0, 0)
}

// 6. ОБРАБОТКА КЛАВИАТУРЫ:
window.addEventListener('keydown', (e) => {

    const step = 0.1 * zoom  // чем ближе тем меньше
    
    if (e.key === '+') {
      zoom *= 0.8
      updateZoomInfo()
    }
    if (e.key === '-') {
      zoom *= 1.25
      updateZoomInfo()
    }
    if (e.key === 'ArrowUp')    offsetY -= step
    if (e.key === 'ArrowDown')  offsetY += step
    if (e.key === 'ArrowLeft')  offsetX -= step
    if (e.key === 'ArrowRight') offsetX += step

    if (e.key === 'a') {
      isAnimated = !isAnimated
      if (isAnimated) animateColors()
    }

    if (e.key === 'j' && isJulia) {
      if (isJuliaAnimated) isJuliaAnimated = false

      else {
        isJuliaAnimated = true
        animateJulia()
      }
    }
    
    render()
});

// 7. ПОПЫТКА СДЕЛАТЬ ЗУМ КОЛЁСИКОМ:
$canvas.addEventListener('wheel', (e) => {
    e.preventDefault()
    console.log(e)
    
    const rect = $canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const fractalX = ((mouseX / $canvas.width) * 3 - 2) * zoom + offsetX
    const fractalY = ((mouseY / $canvas.height) * 2 - 1) * zoom + offsetY

    const zoomStep = e.deltaY < 0 ? 0.9 : 1.11
    zoom *= zoomStep

    offsetX = fractalX - ((mouseX / $canvas.width) * 3 - 2) * zoom
    offsetY = fractalY - ((mouseY / $canvas.height) * 2 - 1) * zoom

    updateZoomInfo()

    render()
}, {passive: false})



let lastTouchX = 0;
let lastTouchY = 0;

$canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        // Запоминаем точку начала касания для одного пальца
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
        // Логика Pinch-to-Zoom (уже была у нас)
        initialPinchDist = getDistance(e.touches[0], e.touches[1]);
    }
}, { passive: false });

$canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Полная блокировка скролла страницы

    if (e.touches.length === 1) {
        // --- ЛОГИКА ПЕРЕМЕЩЕНИЯ (DRAG) ---
        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;

        // Считаем разницу в пикселях
        const dx = touchX - lastTouchX;
        const dy = touchY - lastTouchY;

        // Пересчитываем пиксели в координаты фрактала
        offsetX -= (dx / $canvas.width) * 3 * zoom;
        offsetY -= (dy / $canvas.height) * 2 * zoom;

        lastTouchX = touchX;
        lastTouchY = touchY;

        render(); // Быстрая отрисовка при движении
    } 
    else if (e.touches.length === 2) {
        // --- ЛОГИКА ЗУМА (PINCH) ---
        const currentDist = getDistance(e.touches[0], e.touches[1]);
        const diff = currentDist / initialPinchDist;

        if (Math.abs(1 - diff) > 0.01) { // Порог чувствительности
            zoom *= (diff > 1 ? 0.95 : 1.05);
            initialPinchDist = currentDist;
            render();
        }
    }
}, { passive: false });

$canvas.addEventListener('touchend', () => {
    initialPinchDist = null;
    render();
});


function updateZoomInfo() {
    $zoomInfo.textContent = `Zoom: ${(1 / zoom).toFixed(1)}x`
    requestAnimationFrame(updateZoomInfo)
}

$screenshotBtn.addEventListener('click', () => {
    $canvas.width = 3840
    $canvas.height = 2160
    render()

    $screenshotBtn.textContent = 'Saving...'
    const link = document.createElement('a')
    link.download = 'fractal.png'
    link.href = $canvas.toDataURL()
    link.click()

    $canvas.width = 800
    $canvas.height = 600
    render()
    $screenshotBtn.textContent = 'Сохранить скриншот'
})

function animateColors() {
    if (isAnimated) time1 += 0.02
    render()
    requestAnimationFrame(animateColors) 
}

function animateJulia () {
  if (!isJuliaAnimated) return
  time2 += 0.01
  c[0] = Math.sin(time2)
  c[1] = Math.cos(time2*Math.SQRT2)
  render()
  requestAnimationFrame(animateJulia)
}

$animateBtn.addEventListener('click', () => {
  if (!isJulia) {
    isAnimated = !isAnimated
    $animateBtn.textContent = isAnimated ? 'Остановить' : 'Анимировать'
    if (isAnimated) animateColors()
  } 
  else {
    isJuliaAnimated = !isJuliaAnimated
    $animateBtn.textContent = isJuliaAnimated ? 'Остановить' : 'Анимировать'
    if (isJuliaAnimated) animateJulia()
  }
})

$mandelbrotBtn.addEventListener('click', (e) => {
  isJulia = false
  $mandelbrotBtn.style.backgroundColor = '#48d'
  $juliaBtn.style.backgroundColor = '#59f'
  render()
})
$juliaBtn.addEventListener('click', () => {
  isJulia = true
  $juliaBtn.style.backgroundColor = '#48d'
  $mandelbrotBtn.style.backgroundColor = '#59f'
  render()
})

render()