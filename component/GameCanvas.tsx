"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";

export default function GameCanvas() {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameRef.current) return;

    /* ---------------- MOBILE WARNING OVERLAY ---------------- */
    const mobileOverlay = document.createElement("div");
    mobileOverlay.id = "mobileWarning";
    mobileOverlay.style.position = "absolute";
    mobileOverlay.style.top = "0";
    mobileOverlay.style.left = "0";
    mobileOverlay.style.width = "100%";
    mobileOverlay.style.height = "100%";
    mobileOverlay.style.backgroundColor = "#6a0dad";
    mobileOverlay.style.color = "#ffffff";
    mobileOverlay.style.fontFamily = "Comic Sans MS";
    mobileOverlay.style.fontWeight = "bold";
    mobileOverlay.style.fontSize = "24px";
    mobileOverlay.style.display = "flex";
    mobileOverlay.style.alignItems = "center";
    mobileOverlay.style.justifyContent = "center";
    mobileOverlay.style.textAlign = "center";
    mobileOverlay.style.zIndex = "9999";
    mobileOverlay.style.padding = "20px";
    mobileOverlay.innerText =
      "For a better experience, switch to a larger screen";

    if (gameRef.current) gameRef.current.appendChild(mobileOverlay);

    function checkScreen() {
      if (!mobileOverlay) return;
      if (window.innerWidth < 768) {
        mobileOverlay.style.display = "flex";
      } else {
        mobileOverlay.style.display = "none";
      }
    }

    checkScreen();
    window.addEventListener("resize", checkScreen);

    /* ---------------- LOADING SCENE ---------------- */
    class LoadingScene extends Phaser.Scene {
      loadStartTime: number = 0;

      constructor() {
        super("LoadingScene");
      }

      preload() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBox = this.add.graphics();
        progressBox.fillStyle(0xffffff, 0.2);
        progressBox.fillRoundedRect(
          width / 2 - 200,
          height / 2 - 30,
          400,
          60,
          20,
        );

        const progressBar = this.add.graphics();

        this.load.on("progress", (value: number) => {
          progressBar.clear();
          progressBar.fillStyle(0x6a0dad, 1);
          progressBar.fillRoundedRect(
            width / 2 - 190,
            height / 2 - 20,
            380 * value,
            40,
            20,
          );
        });

        /* -------- CUSTOM ASSETS -------- */
        this.load.image("player", "/player.png");
        this.load.image("player_jump", "/player_jump.png");
        this.load.image("coin", "/coin.png");
        this.load.image("enemy", "/enemy.png");
        this.load.image(
          "ground",
          "https://labs.phaser.io/assets/sprites/platform.png",
        );

        // Record preload start time
        this.loadStartTime = this.time.now;
      }

      create() {
        const elapsed = this.time.now - this.loadStartTime;
        const minTime = 5000; // 5 seconds
        const remaining = Math.max(minTime - elapsed, 0);

        this.time.delayedCall(remaining, () => {
          this.scene.start("GameScene");
        });
      }
    }

    /* ---------------- GAME SCENE ---------------- */
    class GameScene extends Phaser.Scene {
      player: any;
      cursors: any;
      coins: any;
      enemies: any;
      score = 0;
      scoreText: any;
      isGameOver = false;

      basePlayerWidth = 60;
      basePlayerHeight = 80;

      constructor() {
        super("GameScene");
      }

      create() {
        this.isGameOver = false;
        this.physics.resume();
        this.physics.world.setBounds(0, 0, 4000, 800);

        const platforms = this.physics.add.staticGroup();
        for (let i = 0; i < 20; i++) {
          platforms
            .create(i * 200, 760, "ground")
            .setScale(2)
            .refreshBody();
        }

        platforms.create(600, 600, "ground");
        platforms.create(900, 500, "ground");
        platforms.create(1400, 650, "ground");
        platforms.create(1800, 550, "ground");
        platforms.create(2300, 600, "ground");

        /* -------- PLAYER -------- */
        this.player = this.physics.add.sprite(200, 400, "player");
        this.player.setDisplaySize(this.basePlayerWidth, this.basePlayerHeight);
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(true);

        this.physics.add.collider(this.player, platforms);

        this.cursors = this.input.keyboard!.createCursorKeys();

        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setBounds(0, 0, 4000, 800);

        /* -------- COINS -------- */
        this.coins = this.physics.add.group();
        for (let i = 0; i < 25; i++) {
          const coin = this.coins.create(
            Phaser.Math.Between(200, 3800),
            0,
            "coin",
          );
          coin.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
          coin.setScale(0.3);
        }
        this.physics.add.collider(this.coins, platforms);
        this.physics.add.overlap(
          this.player,
          this.coins,
          this.collectCoin,
          undefined,
          this,
        );

        /* -------- ENEMIES -------- */
        this.enemies = this.physics.add.group();
        for (let i = 0; i < 8; i++) {
          const enemy = this.enemies.create(600 + i * 400, 200, "enemy");
          enemy.setBounce(1);
          enemy.setCollideWorldBounds(true);
          enemy.setVelocityX(Phaser.Math.Between(-120, 120));
          enemy.setScale(0.4);
        }
        this.physics.add.collider(this.enemies, platforms);
        this.physics.add.collider(
          this.player,
          this.enemies,
          this.hitEnemy,
          undefined,
          this,
        );

        /* -------- SCORE -------- */
        this.scoreText = this.add
          .text(20, 20, "Score: 0", {
            fontFamily: "Comic Sans MS",
            fontSize: "26px",
            color: "#ffffff",
          })
          .setScrollFactor(0);

        /* -------- FLOATING TITLE -------- */
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const floatingText = this.add
          .text(centerX, centerY, "degenverse", {
            fontFamily: "Comic Sans MS",
            fontSize: "64px",
            fontStyle: "bold",
            color: "#ffffff",
          })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(-1);

        this.tweens.add({
          targets: floatingText,
          y: centerY - 20,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });

        if (mobileOverlay) mobileOverlay.style.display = "none";
      }

      collectCoin(player: any, coin: any) {
        coin.disableBody(true, true);
        this.score += 10;
        this.scoreText.setText("Score: " + this.score);
      }

      hitEnemy() {
        if (this.isGameOver) return;

        this.isGameOver = true;
        this.physics.pause();

        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        this.add
          .text(centerX, centerY - 100, "GAME OVER", {
            fontFamily: "Comic Sans MS",
            fontSize: "64px",
            color: "#ffffff",
          })
          .setOrigin(0.5);

        const button = this.add
          .rectangle(centerX, centerY + 20, 240, 80, 0x6a0dad, 1)
          .setStrokeStyle(4, 0xffffff)
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .setScrollFactor(0);

        this.add
          .text(centerX, centerY + 20, "Restart Game", {
            fontFamily: "Comic Sans MS",
            fontSize: "28px",
            color: "#ffffff",
            fontStyle: "bold",
          })
          .setOrigin(0.5)
          .setScrollFactor(0);

        button.on("pointerover", () => button.setFillStyle(0x8c3cff));
        button.on("pointerout", () => button.setFillStyle(0x6a0dad));
        button.on("pointerdown", () => this.scene.restart());
      }

      update() {
        if (this.isGameOver) return;

        const speed = 260;
        const tiltAmplitude = 0.15; // max tilt (~8.6°)
        const tiltFrequency = 0.005; // sloth-like sway

        // Horizontal movement with sloth-like sway
        if (this.cursors.left.isDown) {
          this.player.setVelocityX(-speed);
          this.player.setFlipX(true);
          this.player.rotation =
            tiltAmplitude * Math.sin(this.time.now * tiltFrequency);
        } else if (this.cursors.right.isDown) {
          this.player.setVelocityX(speed);
          this.player.setFlipX(false);
          this.player.rotation =
            tiltAmplitude * Math.sin(this.time.now * tiltFrequency);
        } else {
          this.player.setVelocityX(0);
          this.player.rotation = Phaser.Math.Linear(
            this.player.rotation,
            0,
            0.15,
          );
        }

        // Jump
        if (this.cursors.up.isDown && this.player.body.touching.down) {
          this.player.setVelocityY(-520);
        }

        // Texture change
        if (!this.player.body.touching.down) {
          this.player.setTexture("player_jump");
        } else {
          this.player.setTexture("player");
        }
      }
    }

    /* ---------------- GAME CONFIG ---------------- */
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: gameRef.current,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 900 },
        },
      },
      scene: [LoadingScene, GameScene],
      backgroundColor: "#6a0dad",
      scale: { mode: Phaser.Scale.RESIZE },
    };

    const game = new Phaser.Game(config);

    return () => {
      game.destroy(true);
      window.removeEventListener("resize", checkScreen);
    };
  }, []);

  return <div ref={gameRef} style={{ position: "relative" }} />;
}
