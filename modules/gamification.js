import { StorageAPI } from "./storage.js";
import { showAlert } from "./modal.js";

export const Gamification = {
  state: {
    xp: 0,
    level: 1,
    streak: 0,
    lastActionDate: null,
    badges: [],
  },

  async init() {
    const gmData = await StorageAPI.get("settings", "gamification");
    if (gmData?.value) {
      this.state = gmData.value;
    }

    // Validate streak logic on load
    const today = new Date().toDateString();
    if (this.state.lastActionDate && this.state.lastActionDate !== today) {
      const lastDate = new Date(this.state.lastActionDate);
      const nowMidnight = new Date();
      nowMidnight.setHours(0, 0, 0, 0);
      const diffTime = nowMidnight - lastDate;
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 1) {
        // Streak broken
        this.state.streak = 1;
        await this.saveState(); // save reset streak
      }
    }
    this.updateUI();
  },

  async saveState() {
    await StorageAPI.save("settings", {
      key: "gamification",
      value: this.state,
    });
    this.updateUI();
  },

  updateUI() {
    const streakDisplay = document.getElementById("streak-display");
    const streakCount = document.getElementById("streak-count");
    const xpDisplay = document.getElementById("xp-display");

    if (streakDisplay && streakCount) {
      streakDisplay.style.display = "flex";
      streakCount.textContent = this.state.streak;
      // Optionally change color based on streak length
      if (this.state.streak > 3) {
        streakDisplay.style.color = "#ef4444"; // hotter flame
      }
    }

    if (xpDisplay) {
      xpDisplay.textContent = `Lvl ${this.state.level} (${this.state.xp} XP)`;
    }
  },

  checkStreak() {
    const today = new Date().toDateString();

    if (!this.state.lastActionDate) {
      this.state.streak = 1;
      this.state.lastActionDate = today;
      return true;
    }

    if (this.state.lastActionDate !== today) {
      const lastDate = new Date(this.state.lastActionDate);
      const nowMidnight = new Date();
      nowMidnight.setHours(0, 0, 0, 0);
      const diffTime = nowMidnight - lastDate;
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        this.state.streak += 1;
      } else if (diffDays > 1) {
        // Streak broken
        this.state.streak = 1;
      }

      this.state.lastActionDate = today;
      return true;
    }
    return false;
  },

  async addXP(amount) {
    this.checkStreak();
    this.state.xp += amount;

    // Level up logic (every 100 XP is a level)
    if (this.state.xp >= this.state.level * 100) {
      this.state.level += 1;
      this.state.xp = 0;
      // Potentially show a toast or modal for leveling up
      this.showLevelUpModal();
    }

    await this.saveState();
  },

  showLevelUpModal() {
    if (typeof showAlert === "function") {
      showAlert(
        `Congratulations! You reached Level ${this.state.level}. Keep up the great work!`,
        "Level Up",
        "success",
      );
    } else {
      console.log(`Level Up! You are now level ${this.state.level}`);
    }
  },
};
