const video = document.getElementById('video');
const expressionDiv = document.getElementById('expression');
const colorBox = document.getElementById('colorBox'); 
const clickText = document.getElementById('clickText');
const title = document.querySelector('h1');
const subtitle = document.querySelector('p');

// 초기 상태: 클릭 텍스트 보여주기
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        clickText.style.display = 'block';
    }, 3000); // 페이드인 후 나타나도록 지연
});

// 클릭 시 메시지 출력 후 감정 인식 시작
clickText.addEventListener('click', () => {
    title.style.display = 'none';
    subtitle.textContent = "잠시 후 카메라가 켜집니다. 카메라를 보며 담고 싶은 감정을 표정으로 드러내주세요.";
    setTimeout(() => {
        subtitle.style.display = 'none';
        startVideo();
        video.style.display = 'block';
        colorBox.style.display = 'block';
        expressionDiv.style.display = 'block';
    }, 3000); // 안내 문구 후 3초 대기
});

// 모델 파일 로드
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.faceExpressionNet.loadFromUri('./models')
]);

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => video.srcObject = stream)
        .catch(err => console.error(err));
}

video.addEventListener('play', () => {
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

        if (detections.length > 0) {
            const expressions = detections[0].expressions;

            const anger = expressions.anger || 0;
            const happy = expressions.happy || 0;
            const sad = expressions.sad || 0;
            const neutral = expressions.neutral || 0;
            const surprised = expressions.surprised || 0;
            const fear = expressions.fear || 0;

            const red = Math.round(
                anger * 255 +
                happy * 255 +
                surprised * 255 +
                fear * 128
            );
            const green = Math.round(
                happy * 255 +
                neutral * 255 +
                surprised * 165
            );
            const blue = Math.round(
                sad * 255 +
                neutral * 255 +
                fear * 255
            );

            const textColor = `rgb(${red}, ${green}, ${blue})`;

            const highestExpression = Object.keys(expressions).reduce((a, b) =>
                expressions[a] > expressions[b] ? a : b
            );

            const emotionColors = {
                anger: 'rgb(255, 0, 0)',
                happy: 'rgb(255, 255, 0)',
                sad: 'rgb(0, 0, 255)',
                neutral: 'rgb(128, 128, 128)',
                surprised: 'rgb(255, 165, 0)',
                fear: 'rgb(128, 0, 128)',
            };

            const dominantColor = emotionColors[highestExpression] || 'white';

            colorBox.style.background = `linear-gradient(to bottom, ${textColor}, ${dominantColor})`;

            if (expressionDiv.textContent !== `Detected Expression: ${highestExpression}`) {
                expressionDiv.style.opacity = 0;
                setTimeout(() => {
                    expressionDiv.textContent = `Detected Expression: ${highestExpression}`;
                    expressionDiv.style.opacity = 1;
                }, 500);
            }
        } else {
            if (expressionDiv.textContent !== 'No face detected') {
                expressionDiv.style.opacity = 0;
                setTimeout(() => {
                    expressionDiv.textContent = 'No face detected';
                    expressionDiv.style.opacity = 1;
                }, 500);
            }
            colorBox.style.background = 'white';
        }
    }, 100);
});
