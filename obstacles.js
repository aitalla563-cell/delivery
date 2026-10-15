/**
 * العوائق: كل عائق تحدٍّ صغير يُحَلّ بسرعة.
 * النتيجة: 'perfect' (حل سريع/ذكي) | 'ok' (حل عادي) | 'fail' (ضاع وقت)
 */
const Obstacles = {
    timers: [], done: true,
    EMOJI: { taxi: '🚕', donkey: '🫏', police: '👮', pothole: '🕳️' },
    TYPES: ['taxi', 'donkey', 'police', 'pothole', 'choice'],

    // سيناريوهات الاختيار: [النص، النتيجة، تعليق]
    CHOICES: [
        { emoji: '🚌', title: 'طوبيس واقف كيعمّر الناس وسادّ الطريق!', opts: [
            ['تسنى حتى يمشي', 'ok', 'سلمتي.. ولكن ضاع الوقت'],
            ['طلع الرصيف وتجاوز', 'fail', 'الرصيف مزدحم! تعطلتي'],
            ['دخل لزنقة جانبية', 'perfect', 'اختصار ذكي! 🧠']] },
        { emoji: '🚌', title: 'الطوبيس ما بغاش يتحرك والناس كتصيح!', opts: [
            ['بوّق بوّق بوّق', 'fail', 'ما نفع البوق 🙉'],
            ['بدّل للمسار الآخر', 'perfect', 'جيت من الجنب بسرعة 🏍️'],
            ['نزل عاون الناس يطلعو', 'ok', 'عمل خير.. ولكن تأخرتي']] },
        { emoji: '🐑', title: 'قطيع غنم كيعبر الطريق!', opts: [
            ['دوز بسرعة وسط الغنم', 'fail', 'الغنم تشتتات والراعي غضب!'],
            ['تسنى حتى يدوزو كاملين', 'ok', 'كلشي دوز.. بعد وقت'],
            ['دوز من الجنب بشوية', 'perfect', 'دوزتي بحال الريح 😎']] },
        { emoji: '🛒', title: 'بائع متجول وقّف عربته فوسط الطريق!', opts: [
            ['عيّط عليه بغضب', 'fail', 'بدا كيجادل معاك 😤'],
            ['عاود ليه بأدب باش يزحزحها', 'perfect', 'الله يعطيك الخير! زحزحها فالحين'],
            ['تسنى حتى يبيع', 'ok', 'بقيتي تسنى شوية']] },
        { emoji: '🚧', title: 'الطريق مقطوعة بسبب الأشغال!', opts: [
            ['دوز من الدرب القديم', 'perfect', 'الدرب ديال الحومة كيعرفك 💪'],
            ['ارجع وحيّد الطريق', 'ok', 'طويلة شوية ولكن وصلتي'],
            ['دوز فوق التراب', 'fail', 'غرقتي فالتراب 🏜️']] }
    ],
    lastChoice: -1,

    every(fn, ms) { const t = setInterval(fn, ms); this.timers.push(t); return t; },
    after(fn, ms) { const t = setTimeout(fn, ms); this.timers.push(t); return t; },
    clearTimers() { this.timers.forEach(t => { clearInterval(t); clearTimeout(t); }); this.timers = []; },
    stop() {
        this.clearTimers(); this.done = true;
        const p = document.getElementById('panel');
        if (p) p.innerHTML = '';
    },
    pick(exclude) {
        const pool = this.TYPES.filter(t => t !== exclude);
        return pool[Math.floor(Math.random() * pool.length)];
    },

    run(type, lvl, fin) {
        this.stop();
        this.done = false;
        const p = document.getElementById('panel');
        const once = r => { if (this.done) return; this.done = true; this.clearTimers(); fin(r); };
        this[type](p, lvl, once);
    },

    // شريط الوقت الصغير
    timerBar(secs, onTimeout) {
        const bar = document.getElementById('mt'), t0 = Date.now();
        this.every(() => {
            const e = (Date.now() - t0) / 1000;
            if (bar) bar.style.width = Math.max(0, 100 - e / secs * 100) + '%';
            if (e >= secs) onTimeout();
        }, 50);
    },
    head(emoji, title, hint) {
        return `<h3>${emoji} ${title}</h3><p>${hint}</p>`;
    },
    bar() { return '<div class="mini-timer"><div id="mt"></div></div>'; },

    // 1) طاكسي واقف: بوّق بسرعة
    taxi(p, lvl, fin) {
        const need = 5 + lvl, t0 = Date.now();
        let n = 0;
        p.innerHTML = this.head('🚕', 'طاكسي واقف فوسط الطريق!', 'الشوفور كيهضر مع الكليان.. بوّق عليه بسرعة!') +
            `<div class="meter"><div id="mf"></div></div><button class="big-btn" id="horn">📯 بووق!</button>` + this.bar();
        document.getElementById('horn').onclick = () => {
            Sounds.play('horn'); n++;
            document.getElementById('mf').style.width = Math.min(100, n / need * 100) + '%';
            if (n >= need) fin((Date.now() - t0) / 1000 < 3.2 ? 'perfect' : 'ok');
        };
        this.timerBar(5.5, () => fin('fail'));
    },

    // 2) كروسة بحمار: تجاوز فالوقت المناسب
    donkey(p, lvl, fin) {
        let pos = 0, dir = 1, tries = 0;
        const half = Math.max(.08, .15 - .015 * lvl), speed = .9 + .15 * lvl;
        p.innerHTML = this.head('🫏', 'كروسة بحمار بطيئة قدامك!', 'تجاوزها فاللحظة المناسبة — وقّف المؤشر فالمنطقة الخضراء') +
            `<div class="bar"><div class="zone" style="left:${(.5 - half) * 100}%;width:${half * 200}%"></div><div class="cursor" id="cur"></div></div>
             <button class="big-btn" id="go">🏍️ تجاوز!</button>` + this.bar();
        const cur = document.getElementById('cur');
        this.every(() => {
            pos += dir * speed * .03;
            if (pos >= 1) { pos = 1; dir = -1; } else if (pos <= 0) { pos = 0; dir = 1; }
            cur.style.left = pos * 100 + '%';
        }, 30);
        document.getElementById('go').onclick = () => {
            if (Math.abs(pos - .5) <= half) fin(tries === 0 ? 'perfect' : 'ok');
            else { tries++; Sounds.play('bad'); Game.addAnger(3); Game.flash('😬 بكري!', 'bad'); }
        };
        this.timerBar(7, () => fin('fail'));
    },

    // 3) الشرطي: عطيه الوثائق الصحيحة
    police(p, lvl, fin) {
        const good = [['🪪', 'البطاقة الوطنية'], ['📄', 'رخصة السياقة'], ['🧾', 'وثيقة التأمين']];
        const bad = [['🎟️', 'تذكرة الطوبيس'], ['🥖', 'وصل الخبز'], ['🃏', 'ورق اللعب'], ['🧦', 'جوارب']];
        const cards = good.map(c => ({ c, ok: true })).concat(bad.slice().sort(() => Math.random() - .5).slice(0, 3).map(c => ({ c, ok: false })))
            .sort(() => Math.random() - .5);
        let found = 0, mistakes = 0;
        p.innerHTML = this.head('👮', 'شرطي بغى يتحقق من هويتك!', 'عطيه الوثائق الصحيحة (3 فقط) بسرعة') +
            '<div class="cards"></div>' + this.bar();
        const box = p.querySelector('.cards');
        cards.forEach(({ c, ok }) => {
            const b = document.createElement('button');
            b.className = 'doc';
            b.innerHTML = `<span>${c[0]}</span><small>${c[1]}</small>`;
            b.onclick = () => {
                if (b.disabled) return;
                b.disabled = true;
                if (ok) {
                    b.classList.add('good'); Sounds.play('good'); found++;
                    if (found === 3) fin(mistakes === 0 ? 'perfect' : mistakes === 1 ? 'ok' : 'fail');
                } else {
                    b.classList.add('wrong'); Sounds.play('bad'); mistakes++;
                    Game.addAnger(4); Game.flash('🤨 هادي ما صحيحة!', 'bad');
                }
            };
            box.appendChild(b);
        });
        this.timerBar(8, () => fin('fail'));
    },

    // 4) الحفر: بدّل المسار 3 مرات
    pothole(p, lvl, fin) {
        let round = 0, mistakes = 0, hole = 0, open = false;
        const lim = Math.max(1.1, 1.9 - .15 * lvl);
        p.innerHTML = this.head('🕳️', 'حفر كبيرة فالطريق!', 'بدّل للمسار اللي ما فيه حفرة — 3 مرات') +
            `<div class="lanes"><div class="lane" id="l0"></div><div class="lane" id="l1"></div></div>
             <div class="two"><button class="big-btn" id="b0">⬆️ المسار الأول</button><button class="big-btn" id="b1">⬇️ المسار الثاني</button></div>`;
        const lanes = [document.getElementById('l0'), document.getElementById('l1')];
        const next = () => {
            if (round >= 3) return fin(mistakes === 0 ? 'perfect' : mistakes === 1 ? 'ok' : 'fail');
            lanes.forEach(l => l.textContent = '');
            hole = Math.random() < .5 ? 0 : 1;
            lanes[hole].textContent = '🕳️';
            open = true; round++;
            this.after(() => { if (open) { open = false; mistakes++; Game.addAnger(3); Sounds.play('bad'); this.after(next, 300); } }, lim * 1000);
        };
        const press = i => {
            if (!open) return;
            open = false;
            if (i === hole) { mistakes++; Game.addAnger(3); Sounds.play('bad'); Game.flash('💥 طحتي فالحفرة!', 'bad'); }
            else Sounds.play('good');
            this.after(next, 350);
        };
        document.getElementById('b0').onclick = () => press(0);
        document.getElementById('b1').onclick = () => press(1);
        next();
    },

    // 5) اختيار الحل الأنسب
    choice(p, lvl, fin) {
        let i;
        do { i = Math.floor(Math.random() * this.CHOICES.length); } while (i === this.lastChoice);
        this.lastChoice = i;
        const sc = this.CHOICES[i];
        Game.setObstacleEmoji(sc.emoji);
        p.innerHTML = this.head(sc.emoji, sc.title, 'شنو غادي تدير؟ اختار الحل الأنسب بسرعة') + '<div class="opts"></div>' + this.bar();
        const box = p.querySelector('.opts');
        sc.opts.slice().sort(() => Math.random() - .5).forEach(([t, r, msg]) => {
            const b = document.createElement('button');
            b.className = 'opt'; b.textContent = t;
            b.onclick = () => {
                box.querySelectorAll('button').forEach(x => x.disabled = true);
                b.classList.add(r === 'fail' ? 'wrong' : 'good');
                Game.flash(msg, r === 'fail' ? 'bad' : 'good');
                this.after(() => fin(r), 700);
            };
            box.appendChild(b);
        });
        this.timerBar(8, () => fin('fail'));
    }
};
