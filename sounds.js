/** المؤثرات الصوتية (WebAudio — بدون ملفات خارجية) */
const Sounds = {
    ctx: null, enabled: true,
    P: {
        horn: [[360, .12, 'square'], [300, .18, 'square']],
        good: [[660, .08], [880, .12]],
        perfect: [[660, .07], [880, .07], [1175, .15]],
        bad: [[200, .25, 'sawtooth']],
        tap: [[500, .04]],
        win: [[523, .1], [659, .1], [784, .1], [1047, .3]],
        lose: [[300, .2, 'sawtooth'], [200, .35, 'sawtooth']],
        block: [[250, .1, 'square'], [180, .15, 'square']]
    },
    play(n) {
        if (!this.enabled) return;
        try {
            this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
            let t = this.ctx.currentTime;
            (this.P[n] || []).forEach(([f, d, type]) => {
                const o = this.ctx.createOscillator(), g = this.ctx.createGain();
                o.type = type || 'sine'; o.frequency.value = f;
                g.gain.setValueAtTime(.12, t);
                g.gain.exponentialRampToValueAtTime(.001, t + d);
                o.connect(g); g.connect(this.ctx.destination);
                o.start(t); o.stop(t + d); t += d;
            });
        } catch (e) {}
    }
};
