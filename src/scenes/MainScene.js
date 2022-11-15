import Phaser from "phaser";

export class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
    this.player = null;
    this.stars = null;
    this.bombs = null;
    this.platforms = null;
    this.cursors = null;
    this.score = 0;
    this.sky = null;
    this.gameOver = false;
    this.scoreText = null;
    this.level = 0;
    this.markers = [];
    this.levelColors = [];
  }

  preload() {
    console.log(">>>preload");
    this.load.image("sky", "assets/sky.png");
    this.load.image("ground", "assets/platform.png");
    this.load.image("star", "assets/star.png");
    this.load.image("bomb", "assets/bomb.png");
    this.load.image("red", "assets/sprites/red.png");
    this.load.spritesheet("dude", "assets/dude.png", { frameWidth: 32, frameHeight: 48 });
    this.load.audio("sfx", ["assets/sound/fx_mixdown.ogg"]);
    this.load.audio("music", ["assets/sound/computer-love.mp3"]);
    this.markers = [
      { name: "alien death", start: 1, duration: 1.0, config: {} },
      { name: "boss hit", start: 3, duration: 0.5, config: { volume: 0.02 } },
      { name: "escape", start: 4, duration: 3.2, config: {} },
      { name: "meow", start: 8, duration: 0.5, config: {} },
      { name: "numkey", start: 9, duration: 0.1, config: {} },
      { name: "ping", start: 10, duration: 1.0, config: { volume: 0.5 } },
      { name: "death", start: 12, duration: 4.2, config: {} },
      { name: "shot", start: 17, duration: 1.0, config: {} },
      { name: "squit", start: 19, duration: 0.3, config: {} }
    ];
    this.levelColors = [
      { topLeft: 0xffffff, topRight: 0xffffff, bottomLeft: 0xffffff, bottomRight: 0xffffff, alpha: 0.05, index: 0 },
      { topLeft: 0x00a00f, topRight: 0x00a00f, bottomLeft: 0x00a00f, bottomRight: 0x00a00f, alpha: 0.1, index: 1 },
      { topLeft: 0xf000f0, topRight: 0xf000f0, bottomLeft: 0xf000f0, bottomRight: 0xf000f0, alpha: 0.2, index: 2 },
      { topLeft: 0x0b0fcc, topRight: 0x0b0fcc, bottomLeft: 0x0b0fcc, bottomRight: 0x0b0f00, alpha: 0.1, index: 3 },
      { topLeft: 0x10ff34, topRight: 0xf0ab34, bottomLeft: 0x10ff34, bottomRight: 0x10ff34, alpha: 0.1, index: 4 },
      { topLeft: 0xa0ab34, topRight: 0xa0ab34, bottomLeft: 0xa0ab34, bottomRight: 0xa0ab34, alpha: 0.1, index: 5 },
      { topLeft: 0xff0000, topRight: 0xff0000, bottomLeft: 0xff0000, bottomRight: 0xff0000, alpha: 0.9, index: 6 },
    ];
  }

  create() {
    console.log(">>>create");

    this.sound.play("music", { volume: 0.5 });
    //  A simple background for our game
    this.sky = this.add.image(400, 300, "sky");

    //  The platforms group contains the ground and the 2 ledges we can jump on
    this.platforms = this.physics.add.staticGroup();

    //  Here we create the ground.
    //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
    this.platforms.create(400, 568, "ground").setScale(2).refreshBody();

    //  Now let's create some ledges
    this.platforms.create(600, 400, "ground");
    this.platforms.create(50, 250, "ground");
    this.platforms.create(750, 220, "ground");

    // The player and its settings
    this.player = this.physics.add.sprite(100, 450, "dude");

    //  Player physics properties. Give the little guy a slight bounce.
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    //  Our player animations, turning, walking left and walking right.
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1
    });

    //  Input Events
    this.cursors = this.input.keyboard.createCursorKeys();

    //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
    this.stars = this.physics.add.group({
      key: "star",
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 }
    });

    this.stars.children.iterate(function(child) {
      //  Give each star a slightly different bounce
      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    this.bombs = this.physics.add.group();

    //  The score
    this.scoreText = this.add.text(16, 16, "Score: 0 level: 0", { fontSize: "32px", fill: "#ffffff" });

    //  Collide the player and the stars with the platforms
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.stars, this.platforms);
    this.physics.add.collider(this.bombs, this.platforms);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);

    this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);
  }

  update() {
    if (this.gameOver) {
      return;
    }

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
      this.player.anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
      this.player.anims.play("right", true);
    } else {
      this.player.setVelocityX(0);

      this.player.anims.play("turn");
    }

    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-330);
    }
  }

  collectStar(player, star) {
    console.log(">>>collectStar");
    star.disableBody(true, true);

    //  Add and update the score
    this.score += 10;
    this.scoreText.setText("Score: " + this.score + " level: " + this.level);
    // play sound
    this.sound.play("sfx", this.markers[5]);

    if (this.stars.countActive(true) === 0) {
      this.level++;
      //  A new batch of stars to collect
      this.stars.children.iterate(function(child) {
        child.enableBody(true, child.x, 0, true, true);
      });

      const x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

      const bomb = this.bombs.create(x, 16, "bomb");
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);

      const particles = this.add.particles("red");
      const { topLeft, topRight, bottomLeft, bottomRight, alpha } = this.levelColors[this.level];
      console.log("level " + this.level, this.levelColors[this.level]);
      /*
      this.platforms.children.iterate(function(child) {
        child.setAngle(5);
      });
      */
      this.sky.setTint(topLeft, topRight, bottomLeft, bottomRight);
      this.sky.setAlpha(1, 1, 0.5, 0.5);

      const emitter = particles.createEmitter({
        speed: 30,
        scale: { start: 0.2, end: 0 },
        blendMode: "ADD"
      });
      emitter.startFollow(bomb);

      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
      bomb.allowGravity = false;
    }
  }

  bounceBomb() {
    console.log(">>>bounceBomb");
    this.sound.play("sfx", this.markers[2]);
  }

  hitBomb(player, bomb) {
    console.log(">>>hitBomb");
    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play("turn");
    this.sound.play("sfx", this.markers[6]);
    this.sound.stopByKey("music");
    this.gameOver = true;
  }
}
