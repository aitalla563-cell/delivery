/** التوصيل المجنون — محرك اللعب */
const Game = {
    TOTAL: 5,
    TIMES: [70, 66, 64, 62, 60],
    COUNT: [3, 3, 4, 5, 5],
    CUSTOMERS: ['سعاد', 'يوسف', 'الحاج بوعزة', 'مي فاطمة', 'الأستاذ كريم', 'هند', 'سي ادريس'],
    FOODS: [['🍲', 'طاجين'], ['🥧', 'بسطيلة'], ['🥙', 'ساندويتش'], ['🍕', 'بيتزا'], ['🥞', 'مسمّن بالعسل'], ['🍜', 'حريرة']],
    MOODS: [
        ['😄', 'مرتاح وكيتسنى فيك'], ['🙂', 'فينك وصلتي؟'], ['😐', 'الوقت كيدوز..'],
        ['😠', 'بدا كيتقلق! زربْ!'], ['🤬', 'غادي يلغي الطلب!!']
    ],
    S: null, O: null, loop: null,
    $(id) { return document.getElementById(id); },

    start() {
        this.S = { order: 0, money: 0, delivered: 0, cancelled: 0 };
        this.nextOrder();
    },

    nextOrder() {
        const S = this.S;
        if (S.order >= this.TOTAL) return this.finish();
        S.order++;
        const i = S.order - 1;
        const cust = this.CUSTOMERS[Math.floor(Math.random() * this.CUSTOMERS.length)];
        const food = this.FOODS[Math.floor(Math.random() * this.FOODS.length)];
        const T = this.TIMES[i], n = this.COUNT[i];
        const points = [];
        for (let k = 1; k <= n; k++) points.push(Math.min(92, (k / (n + 1)) * 100 + (Math.random() * 6 - 3)));
        const types = [];
        for (let k = 0; k < n; k++) types.push(Obstacles.pick(types[k - 1]));
        this.O = { cust, food, T, time: T, progress: 0, anger: 0, calls: 2, points, types, idx: 0,
                   blocked: false, boost: 0, ended: false, waitT: null };
        App.show('screen-game');
        this.$('panel').innerHTML = '';
        this.$('obst').style.display = 'none';
        this.$('scene').classList.remove('paused', 'boost');
        this.$('h-order').textContent = S.order;
        this.$('h-money').textContent = S.money;
        this.updateCall();
        this.hud();
        App.modal(`<div class="big-emoji">${food[0]}</div><h2>طلب جديد!</h2>
            <p><strong>${cust}</strong> طلب <strong>${food[1]}</strong> وهو جيعان 😋</p>
            <p>الوقت: <strong>${T}</strong> ثانية — ${n} عوائق فالطريق</p>
            <button class="btn" onclick="Game.begin()">يلاه نمشيو 🛵</button>`);
    },

    begin() {
        App.closeModal();
        Sounds.play('good');
        clearInterval(this.loop);
        this.loop = setInterval(() => this.tick(), 100);
    },

    tick() {
        const O = this.O;
        if (!O || O.ended) return;
        const dt = .1;
        O.time -= dt;
        O.anger += (100 / (O.T * 1.6)) * dt * (O.blocked ? 2 : 1);
        if (!O.blocked) {
            const speed = (100 / (O.T * .5)) * (O.boost > 0 ? 1.6 : 1);
            O.progress += speed * dt;
            if (O.boost > 0) { O.boost -= dt; if (O.boost <= 0) this.$('scene').classList.remove('boost'); }
            if (O.progress >= 100) { O.progress = 100; this.hud(); return this.arrive(); }
            if (O.idx < O.points.length && O.progress >= O.points[O.idx]) this.block();
        }
        if (O.anger >= 100 || O.time <= 0) { this.hud(); return this.cancel(); }
        this.hud();
    },

    block() {
        const O = this.O, type = O.types[O.idx];
        O.blocked = true;
        Sounds.play('block');
        this.$('scene').classList.add('paused');
        this.setObstacleEmoji(Obstacles.EMOJI[type] || '🚧');
        Obstacles.run(type, this.S.order, r => this.resolve(r));
    },
    setObstacleEmoji(e) { const o = this.$('obst'); o.textContent = e; o.style.display = 'block'; },

    resolve(r) {
        const O = this.O;
        if (!O || O.ended) return;
        O.idx++;
        const p = this.$('panel');
        const free = () => {
            O.blocked = false;
            p.innerHTML = '';
            this.$('obst').style.display = 'none';
            this.$('scene').classList.remove('paused');
            if (O.boost > 0) this.$('scene').classList.add('boost');
        };
        if (r === 'perfect') {
            Sounds.play('perfect');
            O.time += 3; O.anger = Math.max(0, O.anger - 5); O.boost = 5;
            this.flash('⚡ حل سريع! +3 ثواني وتوربو 🔥', 'good');
            free();
        } else if (r === 'ok') {
            Sounds.play('good');
            this.flash('👍 مزيان، كمّل', 'good');
            free();
        } else {
            Sounds.play('bad');
            O.anger = Math.min(99, O.anger + 10);
            this.flash('😬 تعطّلتي 3 ثواني!', 'bad');
            p.innerHTML = '<h3>⏳ ضاع عليك الوقت...</h3><p>الزبون كيتقلق، تسنى شوية</p>';
            O.waitT = setTimeout(() => { if (!O.ended) free(); }, 3000);
        }
        this.hud();
    },

    addAnger(n) { if (this.O && !this.O.ended) this.O.anger = Math.min(99.5, this.O.anger + n); },

    callCustomer() {
        const O = this.O;
        if (!O || O.ended || O.calls <= 0) return;
        O.calls--;
        O.anger = Math.max(0, O.anger - 25);
        Sounds.play('good');
        this.flash('📞 "غادي نوصل دابا، صبر شوية!" 😅', 'good');
        this.updateCall(); this.hud();
    },
    updateCall() {
        const b = this.$('call-btn');
        b.textContent = `📞 اتصل بالزبون (${this.O.calls})`;
        b.disabled = this.O.calls <= 0;
    },

    flash(msg, cls) {
        const f = this.$('flash');
        f.textContent = msg; f.className = 'flash ' + cls;
        void f.offsetWidth;
        f.classList.add('show');
    },

    hud() {
        const O = this.O;
        this.$('h-time').textContent = Math.max(0, Math.ceil(O.time));
        this.$('prog-bike').style.left = O.progress + '%';
        this.$('prog-fill').style.width = O.progress + '%';
        const a = Math.min(100, O.anger);
        const af = this.$('anger-fill');
        af.style.width = a + '%';
        af.style.background = a < 40 ? '#10b981' : a < 70 ? '#f59e0b' : '#ef4444';
        const m = this.MOODS[Math.min(4, Math.floor(a / 22))];
        this.$('c-face').textContent = m[0];
        this.$('c-msg').textContent = `${O.cust}: ${m[1]}`;
        this.$('h-time').parentElement.classList.toggle('low', O.time < 12);
    },

    endOrderCommon() {
        const O = this.O;
        O.ended = true;
        clearInterval(this.loop);
        clearTimeout(O.waitT);
        Obstacles.stop();
        this.$('obst').style.display = 'none';
        this.$('scene').classList.add('paused');
    },

    arrive() {
        this.endOrderCommon();
        const O = this.O, S = this.S;
        const stars = O.anger < 30 ? 3 : O.anger < 60 ? 2 : 1;
        const tip = Math.round(O.time * .4 + (100 - O.anger) * .15);
        const total = 15 + tip;
        S.money += total; S.delivered++;
        Sounds.play('win');
        this.$('h-money').textContent = S.money;
        App.modal(`<div class="big-emoji">${O.food[0]}</div><h2>وصل الطلب! 🎉</h2>
            <p>${O.cust} ${stars === 3 ? 'فرحان بزاف 😍' : stars === 2 ? 'مرتاح 🙂' : 'عاد وصلتي 😒'}</p>
            <div class="stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
            <p>التوصيلة 15 + بقشيش ${tip} = <strong>${total} درهم</strong></p>
            <button class="btn" onclick="Game.after()">${S.order >= this.TOTAL ? 'النتيجة النهائية' : 'الطلب الموالي ➜'}</button>`);
    },

    cancel() {
        this.endOrderCommon();
        this.S.cancelled++;
        Sounds.play('lose');
        const why = this.O.time <= 0 ? 'سالا الوقت' : 'الزبون غضب بزاف';
        App.modal(`<div class="big-emoji">🤬</div><h2>الطلب تلغى!</h2>
            <p>${why}.. ${this.O.cust} عيّط على شي موصل آخر 💔</p>
            <p>0 درهم</p>
            <button class="btn" onclick="Game.after()">${this.S.order >= this.TOTAL ? 'النتيجة النهائية' : 'الطلب الموالي ➜'}</button>`);
    },

    after() { App.closeModal(); this.nextOrder(); },

    finish() {
        const S = this.S;
        const best = Math.max(S.money, App.best());
        App.saveBest(best);
        const rank = S.money >= 150 ? ['👑', 'ملك الديليفري'] : S.money >= 90 ? ['🏍️', 'موصّل محترف'] : S.money >= 40 ? ['🛵', 'موصّل مجتهد'] : ['🐢', 'مازال مبتدئ'];
        this.$('end-rank').textContent = rank[0] + ' ' + rank[1];
        this.$('end-money').textContent = S.money;
        this.$('end-del').textContent = S.delivered + '/' + this.TOTAL;
        this.$('end-best').textContent = best;
        App.show('screen-end');
    },

    stop() {
        clearInterval(this.loop);
        if (this.O) { this.O.ended = true; clearTimeout(this.O.waitT); }
        Obstacles.stop();
    }
};

const App = {
    show(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        window.scrollTo(0, 0);
    },
    home() { Game.stop(); this.closeModal(); this.show('screen-home'); this.updateBest(); },
    modal(html) { document.getElementById('modal-root').innerHTML = `<div class="modal"><div class="modal-content">${html}</div></div>`; },
    closeModal() { document.getElementById('modal-root').innerHTML = ''; },
    best() { try { return +localStorage.getItem('dr_best') || 0; } catch (e) { return 0; } },
    saveBest(v) { try { localStorage.setItem('dr_best', v); } catch (e) {} },
    updateBest() { document.getElementById('home-best').textContent = this.best(); },
    toggleSound() {
        Sounds.enabled = !Sounds.enabled;
        document.getElementById('sound-btn').textContent = Sounds.enabled ? '🔊' : '🔇';
    },
    play() { Sounds.play('good'); Game.start(); }
};
document.addEventListener('DOMContentLoaded', () => App.updateBest());
