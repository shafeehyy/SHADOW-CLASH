document.addEventListener("DOMContentLoaded", () => {

    // =========================================
    // SHADOW CLASH — SCRIPT.JS
    // AI + 2 PLAYER + 5 LEVELS + SFX + VFX
    // =========================================

    let mode = "AI";
    let level = 1;

    let playerHP = 100;
    let enemyHP = 100;

    let hits = 0;
    let combo = 0;

    let running = false;
    let paused = false;
    let attackLock = false;
    let aiTimer = null;

    // =========================================
    // ELEMENT HELPER
    // =========================================

    const $ = id => document.getElementById(id);

    const mainMenu = $("mainMenu");
    const onlineLobby = $("onlineLobby");
    const gameScreen = $("gameScreen");

    const pauseScreen = $("pauseScreen");
    const victoryScreen = $("victoryScreen");
    const defeatScreen = $("defeatScreen");
    const booyahScreen = $("booyahScreen");

    const fighter1 = $("fighter1");
    const fighter2 = $("fighter2");

    const fighter1Character =
        fighter1?.querySelector(".fighter-character");

    const fighter2Character =
        fighter2?.querySelector(".fighter-character");

    // =========================================
    // AUDIO ENGINE
    // No audio files required
    // =========================================

    let audioCtx = null;

    function initAudio() {
        try {
            if (!audioCtx) {
                audioCtx = new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();
            }

            if (audioCtx.state === "suspended") {
                audioCtx.resume();
            }
        } catch (e) {
            console.log("Audio unavailable");
        }
    }

    function tone(
        frequency,
        duration,
        type = "sine",
        volume = 0.08,
        slide = 0
    ) {
        if (!audioCtx) return;

        try {
            const oscillator =
                audioCtx.createOscillator();

            const gain =
                audioCtx.createGain();

            oscillator.type = type;

            oscillator.frequency.setValueAtTime(
                frequency,
                audioCtx.currentTime
            );

            if (slide !== 0) {
                oscillator.frequency.linearRampToValueAtTime(
                    frequency + slide,
                    audioCtx.currentTime + duration
                );
            }

            gain.gain.setValueAtTime(
                volume,
                audioCtx.currentTime
            );

            gain.gain.exponentialRampToValueAtTime(
                0.001,
                audioCtx.currentTime + duration
            );

            oscillator.connect(gain);
            gain.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(
                audioCtx.currentTime + duration
            );

        } catch (e) {}
    }

    // =========================================
    // SFX
    // =========================================

    function sfxButton() {
        tone(520, 0.07, "square", 0.045, 80);
    }

    function sfxPunch() {
        tone(130, 0.09, "sawtooth", 0.10, -70);
        setTimeout(() => {
            tone(70, 0.07, "square", 0.06, -25);
        }, 35);
    }

    function sfxKick() {
        tone(105, 0.12, "sawtooth", 0.12, -65);
        setTimeout(() => {
            tone(55, 0.10, "square", 0.07, -20);
        }, 45);
    }

    function sfxSpecial() {
        tone(180, 0.20, "sawtooth", 0.08, 500);
        setTimeout(() => {
            tone(600, 0.20, "square", 0.06, -350);
        }, 80);
        setTimeout(() => {
            tone(1000, 0.15, "sine", 0.05, -600);
        }, 160);
    }

    function sfxHit() {
        tone(90, 0.12, "square", 0.10, -40);
        tone(260, 0.06, "sawtooth", 0.06, -100);
    }

    function sfxPlayerHit() {
        tone(75, 0.13, "sawtooth", 0.11, -50);
    }

    function sfxVictory() {
        tone(523, 0.15, "sine", 0.08, 80);

        setTimeout(() => {
            tone(659, 0.15, "sine", 0.08, 100);
        }, 130);

        setTimeout(() => {
            tone(784, 0.25, "sine", 0.10, 150);
        }, 260);
    }

    function sfxLevelUp() {
        tone(440, 0.12, "square", 0.06, 120);

        setTimeout(() => {
            tone(660, 0.15, "square", 0.07, 160);
        }, 120);

        setTimeout(() => {
            tone(880, 0.20, "square", 0.08, 200);
        }, 240);
    }

    function sfxDefeat() {
        tone(250, 0.20, "sawtooth", 0.08, -120);

        setTimeout(() => {
            tone(130, 0.35, "sawtooth", 0.09, -80);
        }, 160);
    }

    function sfxBooyah() {

        tone(523, 0.15, "square", 0.08, 100);

        setTimeout(() => {
            tone(659, 0.15, "square", 0.08, 130);
        }, 130);

        setTimeout(() => {
            tone(784, 0.15, "square", 0.09, 150);
        }, 260);

        setTimeout(() => {
            tone(1046, 0.40, "sine", 0.12, 250);
        }, 390);
    }

    // =========================================
    // MENU BUTTONS
    // =========================================

    $("aiModeBtn").onclick = () => {
        initAudio();
        sfxButton();
        startGame("AI");
    };

    $("localModeBtn").onclick = () => {
        initAudio();
        sfxButton();
        startGame("LOCAL");
    };

    $("onlineModeBtn").onclick = () => {
        initAudio();
        sfxButton();

        mainMenu.classList.add("hidden");
        onlineLobby.classList.remove("hidden");
    };

    // =========================================
    // START GAME
    // =========================================

    function startGame(selectedMode) {

        initAudio();

        stopAI();

        mode = selectedMode;
        level = 1;

        resetBattle();

        mainMenu.classList.add("hidden");
        onlineLobby.classList.add("hidden");
        victoryScreen.classList.add("hidden");
        defeatScreen.classList.add("hidden");
        booyahScreen.classList.add("hidden");

        gameScreen.classList.remove("hidden");

        $("modeDisplay").textContent =
            mode === "AI"
                ? "AI"
                : mode === "LOCAL"
                    ? "2P"
                    : "ONLINE";

        $("connectionText").textContent =
            mode === "AI"
                ? "AI"
                : mode === "LOCAL"
                    ? "LOCAL"
                    : "ONLINE";

        if (mode === "LOCAL") {

            $("player2Name").textContent =
                "PLAYER 2";

            $("player2Controls")
                .classList.remove("hidden");

            $("aiStatus")
                .classList.add("hidden");

        } else {

            $("player2Controls")
                .classList.add("hidden");

            $("player2Name").textContent =
                "ENEMY";

            $("aiStatus")
                .classList.remove("hidden");

            $("aiStatus").textContent =
                "🤖 AI ACTIVE";
        }

        running = true;
        paused = false;

        updateUI();

        if (mode === "AI") {
            startAI();
        }
    }

    // =========================================
    // RESET BATTLE
    // =========================================

    function resetBattle() {

        playerHP = 100;
        enemyHP = 100;

        hits = 0;
        combo = 0;

        attackLock = false;

        $("comboDisplay").textContent = "";

        updateUI();
    }

    // =========================================
    // UPDATE UI
    // =========================================

    function updateUI() {

        playerHP =
            Math.max(0, Math.min(100, playerHP));

        enemyHP =
            Math.max(0, Math.min(100, enemyHP));

        $("player1HpBar").style.width =
            playerHP + "%";

        $("player2HpBar").style.width =
            enemyHP + "%";

        $("player1HpText").textContent =
            Math.ceil(playerHP);

        $("player2HpText").textContent =
            Math.ceil(enemyHP);

        $("levelNumber").textContent =
            level;

        $("levelInfo").textContent =
            `${level} / 5`;

        $("hits").textContent =
            hits;

        $("combo").textContent =
            combo;
    }

    // =========================================
    // PLAYER 1 ATTACKS
    // =========================================

    $("p1PunchBtn").onclick = () => {
        initAudio();
        playerAttack("punch", 10);
    };

    $("p1KickBtn").onclick = () => {
        initAudio();
        playerAttack("kick", 15);
    };

    $("p1SpecialBtn").onclick = () => {
        initAudio();
        playerAttack("special", 25);
    };

    function playerAttack(type, baseDamage) {

        if (!running || paused) return;
        if (attackLock) return;
        if (enemyHP <= 0) return;

        attackLock = true;

        if (type === "punch") sfxPunch();
        if (type === "kick") sfxKick();
        if (type === "special") sfxSpecial();

        animateFighter(
            fighter1,
            type
        );

        createVFX();

        const damage =
            calculatePlayerDamage(baseDamage);

        enemyHP -= damage;

        hits++;
        combo++;

        showDamage(damage);

        if (combo >= 2) {

            $("comboDisplay").textContent =
                `${combo} HIT COMBO!`;

        }

        updateUI();

        checkEnemy();

        setTimeout(() => {
            attackLock = false;
        }, type === "special" ? 750 : 450);
    }

    // =========================================
    // PLAYER 2
    // =========================================

    $("p2PunchBtn").onclick = () => {
        initAudio();
        playerTwoAttack("punch", 10);
    };

    $("p2KickBtn").onclick = () => {
        initAudio();
        playerTwoAttack("kick", 15);
    };

    $("p2SpecialBtn").onclick = () => {
        initAudio();
        playerTwoAttack("special", 25);
    };

    function playerTwoAttack(type, damage) {

        if (mode !== "LOCAL") return;
        if (!running || paused) return;
        if (playerHP <= 0) return;

        if (type === "punch") sfxPunch();
        if (type === "kick") sfxKick();
        if (type === "special") sfxSpecial();

        animateFighter(
            fighter2,
            type,
            true
        );

        createVFX();

        playerHP -= damage;

        hits++;
        combo++;

        showDamage(damage);

        updateUI();

        checkPlayer();
    }

    // =========================================
    // DAMAGE CALCULATION
    // =========================================

    function calculatePlayerDamage(base) {

        const levelBonus =
            (level - 1) * 3;

        const random =
            Math.floor(Math.random() * 6);

        return base + levelBonus + random;
    }

    // =========================================
    // ENEMY CHECK
    // =========================================

    function checkEnemy() {

        if (enemyHP > 0) return;

        enemyHP = 0;

        updateUI();

        running = false;

        stopAI();

        sfxVictory();

        setTimeout(() => {
            levelComplete();
        }, 650);
    }

    // =========================================
    // PLAYER CHECK
    // =========================================

    function checkPlayer() {

        if (playerHP > 0) return;

        playerHP = 0;

        updateUI();

        running = false;

        stopAI();

        sfxDefeat();

        setTimeout(() => {

            defeatScreen.classList.remove(
                "hidden"
            );

        }, 600);
    }

    // =========================================
    // LEVEL COMPLETE
    // =========================================

    function levelComplete() {

        // LEVEL 5 COMPLETE
        if (level >= 5) {

            showBooyah();
            return;
        }

        $("victoryLevel").textContent =
            level;

        $("victoryHits").textContent =
            hits;

        $("victoryMessage").textContent =
            `LEVEL ${level} CLEARED!`;

        victoryScreen.classList.remove(
            "hidden"
        );
    }

    // =========================================
    // NEXT LEVEL
    // =========================================

    $("nextLevelBtn").onclick = () => {

        initAudio();

        sfxLevelUp();

        victoryScreen.classList.add(
            "hidden"
        );

        level++;

        resetBattle();

        running = true;

        if (mode === "AI") {
            startAI();
        }
    };

    // =========================================
    // AI SYSTEM
    // =========================================

    function startAI() {

        stopAI();

        if (mode !== "AI") return;
        if (!running) return;

        $("aiStatus").textContent =
            "🤖 AI ACTIVE";

        scheduleAI();
    }

    function stopAI() {

        if (aiTimer !== null) {

            clearTimeout(aiTimer);
            aiTimer = null;
        }
    }

    function scheduleAI() {

        if (!running) return;
        if (paused) return;
        if (mode !== "AI") return;

        /*
          Every level AI becomes faster.
          It also has random attack timing,
          so the enemy doesn't feel robotic.
        */

        const minDelay =
            Math.max(
                450,
                1200 - level * 100
            );

        const maxDelay =
            Math.max(
                850,
                1900 - level * 130
            );

        const delay =
            Math.floor(
                minDelay +
                Math.random() *
                (maxDelay - minDelay)
            );

        aiTimer = setTimeout(() => {

            if (
                running &&
                !paused &&
                playerHP > 0
            ) {
                aiAttack();
            }

            scheduleAI();

        }, delay);
    }

    // =========================================
    // AI ATTACK
    // =========================================

    function aiAttack() {

        if (playerHP <= 0) return;

        const random =
            Math.random();

        let type;
        let baseDamage;

        if (level >= 4 && random < 0.20) {

            type = "special";
            baseDamage = 18;

        } else if (random < 0.52) {

            type = "kick";
            baseDamage = 11;

        } else {

            type = "punch";
            baseDamage = 8;
        }

        const damage =
            baseDamage +
            Math.floor(level * 1.5);

        if (type === "punch") sfxPunch();
        if (type === "kick") sfxKick();
        if (type === "special") sfxSpecial();

        animateFighter(
            fighter2,
            type,
            true
        );

        createVFX();

        playerHP -= damage;

        combo = 0;

        sfxPlayerHit();

        showDamage(damage);

        updateUI();

        checkPlayer();
    }

    // =========================================
    // FIGHTER ANIMATION
    // =========================================

    function animateFighter(
        fighter,
        type,
        enemy = false
    ) {

        fighter.classList.remove(
            "punch-animation",
            "kick-animation",
            "special-animation",
            "enemy-attack"
        );

        void fighter.offsetWidth;

        if (enemy) {

            fighter.classList.add(
                "enemy-attack"
            );

        } else {

            fighter.classList.add(
                `${type}-animation`
            );
        }

        setTimeout(() => {

            fighter.classList.remove(
                "punch-animation",
                "kick-animation",
                "special-animation",
                "enemy-attack"
            );

        }, 700);
    }

    // =========================================
    // HIT VFX
    // =========================================

    function createVFX() {

        const vfx = $("hitVfx");
        const arena = $("arena");

        if (!vfx || !arena) return;

        vfx.classList.remove("active");
        arena.classList.remove("screen-shake");

        void vfx.offsetWidth;

        vfx.classList.add("active");

        void arena.offsetWidth;

        arena.classList.add("screen-shake");

        // Extra particles
        createHitParticles();

        sfxHit();

        setTimeout(() => {

            vfx.classList.remove("active");
            arena.classList.remove("screen-shake");

        }, 550);
    }

    // =========================================
    // EXTRA HIT PARTICLES
    // =========================================

    function createHitParticles() {

        const arena = $("arena");

        if (!arena) return;

        for (let i = 0; i < 12; i++) {

            const particle =
                document.createElement("span");

            particle.textContent =
                Math.random() > .5
                    ? "✦"
                    : "•";

            particle.style.position =
                "absolute";

            particle.style.left =
                "50%";

            particle.style.top =
                "52%";

            particle.style.zIndex =
                "45";

            particle.style.pointerEvents =
                "none";

            particle.style.fontSize =
                `${8 + Math.random() * 15}px`;

            particle.style.transition =
                "all .55s ease-out";

            arena.appendChild(particle);

            const x =
                (Math.random() - .5) * 220;

            const y =
                (Math.random() - .5) * 140;

            requestAnimationFrame(() => {

                particle.style.transform =
                    `translate(${x}px, ${y}px) scale(.2)`;

                particle.style.opacity = "0";
            });

            setTimeout(() => {
                particle.remove();
            }, 600);
        }
    }

    // =========================================
    // DAMAGE TEXT
    // =========================================

    function showDamage(damage) {

        const text = $("damageText");

        if (!text) return;

        text.textContent =
            `-${damage}`;

        text.classList.remove("show");

        void text.offsetWidth;

        text.classList.add("show");

        setTimeout(() => {

            text.classList.remove("show");

        }, 600);
    }

    // =========================================
    // PAUSE
    // =========================================

    $("pauseBtn").onclick = () => {

        initAudio();

        if (!running) return;

        paused = true;

        stopAI();

        sfxButton();

        pauseScreen.classList.remove(
            "hidden"
        );
    };

    $("resumeBtn").onclick = () => {

        initAudio();

        paused = false;

        sfxButton();

        pauseScreen.classList.add(
            "hidden"
        );

        if (mode === "AI") {
            startAI();
        }
    };

    // =========================================
    // MAIN MENU
    // =========================================

    function mainMenuOpen() {

        initAudio();

        stopAI();

        running = false;
        paused = false;

        sfxButton();

        pauseScreen.classList.add("hidden");
        victoryScreen.classList.add("hidden");
        defeatScreen.classList.add("hidden");
        booyahScreen.classList.add("hidden");

        gameScreen.classList.add("hidden");
        onlineLobby.classList.add("hidden");

        mainMenu.classList.remove("hidden");
    }

    $("menuBtn").onclick =
        mainMenuOpen;

    $("pauseMenuBtn").onclick =
        mainMenuOpen;

    $("victoryMenuBtn").onclick =
        mainMenuOpen;

    $("defeatMenuBtn").onclick =
    mainMenuOpen;

    $("booyahMenuBtn").onclick =
        mainMenuOpen;

    // =========================================
    // RETRY
    // =========================================

    $("retryBtn").onclick = () => {

        initAudio();

        sfxButton();

        defeatScreen.classList.add(
            "hidden"
        );

        level = 1;

        resetBattle();

        running = true;

        if (mode === "AI") {
            startAI();
        }
    };

    // =========================================
    // BOOYAAH
    // =========================================

    function showBooyah() {

        stopAI();

        running = false;

        booyahScreen.classList.remove(
            "hidden"
        );

        sfxBooyah();

        createBooyahParticles();
    }

    $("booyahRestartBtn").onclick = () => {

        initAudio();

        sfxButton();

        booyahScreen.classList.add(
            "hidden"
        );

        level = 1;

        resetBattle();

        running = true;

        if (mode === "AI") {
            startAI();
        }
    };

    // =========================================
    // BOOYAAH PARTICLES
    // =========================================

    function createBooyahParticles() {

        const container =
            document.querySelector(
                ".booyah-particles"
            );

        if (!container) return;

        container.innerHTML = "";

        for (let i = 0; i < 55; i++) {

            const p =
                document.createElement("span");

            p.textContent =
                Math.random() > .5
                    ? "★"
                    : "✦";

            p.style.left =
                Math.random() * 100 + "%";

            p.style.top =
                70 + Math.random() * 40 + "%";

            p.style.animationDelay =
                "-" +
                Math.random() * 4 +
                "s";

            container.appendChild(p);
        }
    }

    // =========================================
    // KEYBOARD CONTROLS
    // =========================================

    document.addEventListener(
        "keydown",
        event => {

            if (!running || paused)
                return;

            const key =
                event.key.toLowerCase();

            if (key === "a") {
                initAudio();
                playerAttack("punch", 10);
            }

            if (key === "s") {
                initAudio();
                playerAttack("kick", 15);
            }

            if (key === "d") {
                initAudio();
                playerAttack("special", 25);
            }

            // PLAYER 2
            if (mode === "LOCAL") {

                if (key === "j") {
                    initAudio();
                    playerTwoAttack(
                        "punch",
                        10
                    );
                }

                if (key === "k") {
                    initAudio();
                    playerTwoAttack(
                        "kick",
                        15
                    );
                }

                if (key === "l") {
                    initAudio();
                    playerTwoAttack(
                        "special",
                        25
                    );
                }
            }
        }
    );

    // =========================================
    // ONLINE LOBBY
    // =========================================

    $("backFromLobbyBtn").onclick = () => {

        initAudio();
        sfxButton();

        onlineLobby.classList.add(
            "hidden"
        );

        mainMenu.classList.remove(
            "hidden"
        );
    };

    $("createRoomBtn").onclick = () => {

        initAudio();
        sfxButton();

        const name =
            $("playerName").value.trim();

        if (!name) {

            $("lobbyMessage").textContent =
                "Enter your player name.";

            return;
        }

        const room =
            generateRoomID();

        $("roomId").value =
            room;

        $("lobbyMessage").textContent =
            `Room created: ${room}`;
    };

    $("joinRoomBtn").onclick = () => {

        initAudio();
        sfxButton();

        const name =
            $("playerName").value.trim();

        const room =
            $("roomId").value.trim();

        if (!name || !room) {

            $("lobbyMessage").textContent =
                "Enter name and Room ID.";

            return;
        }

        $("lobbyMessage").textContent =
            `Joining room ${room}...`;
    };

    function generateRoomID() {

        return Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();
    }

    // =========================================
    // OPTIONAL PHOTO UPLOAD
    // =========================================
    // If these inputs exist in HTML,
    // they will automatically work.

    const playerPhotoInput =
        $("playerPhotoInput");

    const enemyPhotoInput =
        $("enemyPhotoInput");

    if (playerPhotoInput) {

        playerPhotoInput.onchange =
            function () {

                const file =
                    this.files?.[0];

                if (!file) return;

                if (!file.type.startsWith("image/"))
                    return;

                const url =
                    URL.createObjectURL(file);

                if (fighter1Character) {

                    fighter1Character.innerHTML =
                        `<img src="${url}"
                              alt="Player"
                              draggable="false">`;
                }
            };
    }

    if (enemyPhotoInput) {

        enemyPhotoInput.onchange =
            function () {

                const file =
                    this.files?.[0];

                if (!file) return;

                if (!file.type.startsWith("image/"))
                    return;

                const url =
                    URL.createObjectURL(file);

                if (fighter2Character) {

                    fighter2Character.innerHTML =
                        `<img src="${url}"
                              alt="Enemy"
                              draggable="false">`;
                }
            };
    }

    // =========================================
    // INITIALIZE
    // =========================================

    updateUI();

    console.log(
        "⚔️ SHADOW CLASH READY — SFX ENABLED"
    );

});
