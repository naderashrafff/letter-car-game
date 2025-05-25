document.addEventListener('DOMContentLoaded', () => {
    const car = document.getElementById('car');
    const targetLetterDisplay = document.getElementById('target-letter-display');
    const choicesArea = document.getElementById('choices-area');
    const feedbackText = document.getElementById('feedback-text');
    const correctSound = document.getElementById('correct-sound');
    const wrongSound = document.getElementById('wrong-sound');
    const resetButton = document.getElementById('reset-button');
    const road = document.getElementById('road');
    const finishLine = document.getElementById('finish-line');

    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    let currentLetterIndex = 0;
    let currentTargetLetter = '';
    let carPosition = 20;
    let carMoveDistance = 0; // سيتم حسابه في startGame
    const numChoices = 3;
    let gameWon = false;

    function calculateCarMoveDistance() {
        const roadWidth = road.offsetWidth;
        const carWidth = car.offsetWidth;
        const finishLineWidth = finishLine.offsetWidth;
        const finishLineRightOffset = parseFloat(getComputedStyle(finishLine).right); // Get actual 'right' value
        
        // المسافة الكلية المتاحة للحركة قبل الوصول إلى خط النهاية
        // (عرض الطريق) - (عرض السيارة) - (مسافة خط النهاية من اليمين) - (عرض خط النهاية) - (هامش بداية السيارة)
        const totalMovableSpace = roadWidth - carWidth - finishLineRightOffset - finishLineWidth - carPosition;
        
        if (letters.length > 0) {
            carMoveDistance = totalMovableSpace / letters.length;
        } else {
            carMoveDistance = 0; // تجنب القسمة على صفر
        }
        // تأكد أن مسافة الحركة ليست سالبة (في حال كان الطريق ضيقًا جدًا)
        if (carMoveDistance < 5) carMoveDistance = 5; // حد أدنى للحركة
    }


    function startGame() {
        currentLetterIndex = 0;
        carPosition = 20;
        car.style.left = carPosition + 'px';
        car.style.transition = 'left 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
        feedbackText.textContent = '';
        resetButton.style.display = 'none';
        choicesArea.innerHTML = '';
        gameWon = false;
        
        finishLine.style.display = 'block';
        finishLine.style.right = '30px'; // يمكنك ضبط هذا الرقم

        calculateCarMoveDistance(); // حساب مسافة الحركة بعد عرض خط النهاية
        loadNextLetter();
    }

    function loadNextLetter() {
        if (gameWon) return;

        if (currentLetterIndex >= letters.length) {
            // هذا السيناريو يعني أن الحروف انتهت لكن لم يصل لخط النهاية بعد
            // وهو ما نحاول تجنبه بحساب carMoveDistance بشكل صحيح
            // كإجراء احتياطي، يمكننا اعتبارها فوزًا هنا أيضًا
            winGame(); 
            return;
        }

        currentTargetLetter = letters[currentLetterIndex];
        targetLetterDisplay.textContent = currentTargetLetter;
        feedbackText.textContent = '';
        choicesArea.innerHTML = '';

        const choices = generateChoices(currentTargetLetter);
        choices.forEach(letter => {
            const button = document.createElement('button');
            button.classList.add('choice-btn');
            button.textContent = letter;
            button.addEventListener('click', () => handleChoice(letter, button));
            choicesArea.appendChild(button);
        });
        disableChoiceButtons(false);
    }

    function generateChoices(correctLetter) {
        let choices = [correctLetter];
        const availableLetters = letters.filter(l => l !== correctLetter);
        
        while (choices.length < numChoices && availableLetters.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableLetters.length);
            const randomLetter = availableLetters.splice(randomIndex, 1)[0];
            choices.push(randomLetter); // لا نحتاج للتحقق من التضمين لأننا نزيل من availableLetters
        }
        
        const allPossibleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        while (choices.length < numChoices) {
            const randomChar = allPossibleChars[Math.floor(Math.random() * allPossibleChars.length)];
            if (!choices.includes(randomChar) && randomChar !== correctLetter) {
                choices.push(randomChar);
            }
        }

        for (let i = choices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [choices[i], choices[j]] = [choices[j], choices[i]];
        }
        return choices;
    }

    function handleChoice(chosenLetter, buttonElement) {
        if (gameWon) return;

        disableChoiceButtons(true);

        if (chosenLetter === currentTargetLetter) {
            feedbackText.textContent = 'إجابة صحيحة!';
            feedbackText.style.color = '#27ae60';
            correctSound.currentTime = 0;
            correctSound.play();
            buttonElement.classList.add('correct');
            
            carPosition += carMoveDistance;

            const carRightEdge = carPosition + car.offsetWidth;
            const finishLineLeftEdge = road.offsetWidth - parseFloat(getComputedStyle(finishLine).right) - finishLine.offsetWidth;

            if (carRightEdge >= finishLineLeftEdge || currentLetterIndex === letters.length -1 ) { // نفوز أيضًا مع آخر حرف
                 // وضع السيارة قبل خط النهاية بقليل أو عنده
                car.style.left = (finishLineLeftEdge - car.offsetWidth + (car.offsetWidth / 4) ) + 'px';
                winGame();
            } else {
                 car.style.left = carPosition + 'px';
            }

            currentLetterIndex++;
            setTimeout(() => {
                buttonElement.classList.remove('correct');
                if (!gameWon) {
                    loadNextLetter();
                }
                if(!gameWon) disableChoiceButtons(false);
            }, 1500);

        } else {
            feedbackText.textContent = 'حاول مرة أخرى!';
            feedbackText.style.color = '#c0392b';
            wrongSound.currentTime = 0;
            wrongSound.play();
            buttonElement.classList.add('wrong');
            highlightCorrectAnswer();

            setTimeout(() => {
                buttonElement.classList.remove('wrong');
                disableChoiceButtons(false);
            }, 1500);
        }
    }

    function winGame() {
        if (gameWon) return;
        gameWon = true;
        feedbackText.textContent = "رائع! لقد وصلت إلى خط النهاية!";
        feedbackText.style.color = 'purple';
        targetLetterDisplay.textContent = "🎉🏆🎉";
        choicesArea.innerHTML = '';
        resetButton.style.display = 'block';
        disableChoiceButtons(true); // تعطيل أي أزرار متبقية (احتياطي)

        // يمكنك تشغيل صوت فوز خاص
        // correctSound.src = "assets/win_sound.mp3";
        // correctSound.play();
    }

    function disableChoiceButtons(disable) {
        const buttons = choicesArea.querySelectorAll('.choice-btn');
        buttons.forEach(btn => {
            btn.disabled = disable;
        });
    }
    
    function highlightCorrectAnswer() {
        const buttons = choicesArea.querySelectorAll('.choice-btn');
        buttons.forEach(btn => {
            if (btn.textContent === currentTargetLetter) {
                btn.classList.add('correct');
                setTimeout(() => btn.classList.remove('correct'), 1500);
            }
        });
    }
    
    window.addEventListener('resize', calculateCarMoveDistance); // إعادة حساب المسافة عند تغيير حجم النافذة
    resetButton.addEventListener('click', startGame);

    startGame();
});