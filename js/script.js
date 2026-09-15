/* =========================================================
   หมูปิ้งบ้านสวน — shared front-end helpers
   Cart (localStorage, per-viewer convenience), nav highlighting,
   toast, star-input builder, countdown, decorative QR grid.
   ========================================================= */
(function(){
  "use strict";

  /* ---------- safe localStorage wrapper ---------- */
  var storage = {
    get:function(key,fallback){
      try{
        var raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      }catch(e){ return fallback; }
    },
    set:function(key,value){
      try{ window.localStorage.setItem(key, JSON.stringify(value)); }catch(e){ /* ignore */ }
    }
  };
  var CART_KEY = "mp_cart_v1";

  /* ---------- toast ---------- */
  function toast(msg, ms){
    var el = document.getElementById("mpToast");
    if(!el){
      el = document.createElement("div");
      el.id = "mpToast";
      el.className = "mp-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function(){ el.classList.remove("show"); }, ms || 2200);
  }
  window.mpToast = toast;

  /* ---------- cart ---------- */
  var Cart = {
    items: storage.get(CART_KEY, []), // [{id,name,price,emoji,qty}]
    save:function(){ storage.set(CART_KEY, this.items); this.renderBadge(); },
    add:function(item, qty){
      qty = qty || 1;
      var existing = this.items.find(function(i){ return i.id === item.id; });
      if(existing){ existing.qty += qty; }
      else{ this.items.push(Object.assign({}, item, {qty:qty})); }
      this.save();
      this.renderDrawer();
    },
    setQty:function(id, qty){
      var it = this.items.find(function(i){ return i.id === id; });
      if(!it) return;
      it.qty = Math.max(1, qty|0);
      this.save();
      this.renderDrawer();
    },
    remove:function(id){
      this.items = this.items.filter(function(i){ return i.id !== id; });
      this.save();
      this.renderDrawer();
    },
    clear:function(){ this.items = []; this.save(); this.renderDrawer(); },
    count:function(){ return this.items.reduce(function(n,i){ return n + i.qty; }, 0); },
    total:function(){ return this.items.reduce(function(n,i){ return n + i.qty*i.price; }, 0); },
    renderBadge:function(){
      var badges = document.querySelectorAll("[data-cart-count]");
      badges.forEach(function(b){ b.textContent = Cart.count(); });
    },
    renderDrawer:function(){
      var body = document.getElementById("cartDrawerBody");
      var footTotal = document.getElementById("cartDrawerTotal");
      if(!body) return;
      if(this.items.length === 0){
        body.innerHTML = '<div class="cd-empty">🧺<br>ยังไม่มีสินค้าในตะกร้า</div>';
      } else {
        body.innerHTML = this.items.map(function(i){
          return (
            '<div class="cd-item" data-id="'+i.id+'">' +
              '<div class="thumb">'+(i.emoji||"🍢")+'</div>' +
              '<div class="info">' +
                '<div class="name">'+i.name+'</div>' +
                '<div class="text-ink-soft" style="font-size:.82rem;">'+i.price+' บาท / หน่วย</div>' +
                '<div class="qty-add mt-1">' +
                  '<button type="button" data-act="dec">−</button>' +
                  '<input type="text" readonly value="'+i.qty+'">' +
                  '<button type="button" data-act="inc">+</button>' +
                  '<button type="button" class="ms-2 text-brick" data-act="del" style="background:none;border:none;font-weight:700;">ลบ</button>' +
                '</div>' +
              '</div>' +
            '</div>'
          );
        }).join("");
      }
      if(footTotal) footTotal.textContent = this.total().toLocaleString("th-TH") + " บาท";
    }
  };
  window.MPCart = Cart;

  /* event delegation for drawer qty buttons */
  document.addEventListener("click", function(e){
    var btn = e.target.closest("[data-act]");
    if(!btn) return;
    var row = btn.closest(".cd-item");
    if(!row) return;
    var id = row.getAttribute("data-id");
    var item = Cart.items.find(function(i){ return i.id === id; });
    if(!item) return;
    if(btn.dataset.act === "inc") Cart.setQty(id, item.qty+1);
    if(btn.dataset.act === "dec") Cart.setQty(id, item.qty-1 <= 0 ? 1 : item.qty-1);
    if(btn.dataset.act === "del") Cart.remove(id);
  });

  /* cart drawer open/close */
  function toggleDrawer(open){
    var drawer = document.getElementById("cartDrawer");
    var backdrop = document.getElementById("cartDrawerBackdrop");
    if(!drawer || !backdrop) return;
    drawer.classList.toggle("open", open);
    backdrop.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
  }
  window.mpOpenCart = function(){ Cart.renderDrawer(); toggleDrawer(true); };
  window.mpCloseCart = function(){ toggleDrawer(false); };

  /* ---------- nav active state ---------- */
  function markActiveNav(){
    var path = (location.pathname.split("/").pop() || "index.html");
    document.querySelectorAll("[data-nav]").forEach(function(a){
      var target = a.getAttribute("data-nav");
      if(target === path || (path === "" && target === "index.html")){
        a.classList.add("active");
      }
    });
  }

  /* ---------- shared footer ---------- */
  function syncFooter(){
    var footer = document.querySelector("footer.site-footer");
    if(!footer) return;
    footer.innerHTML = `
  <div class="wrap">
    <div class="row g-4">
      <div class="col-lg-4">
        <div class="fbrand mb-2"><img src="img/logo.jpg" alt="โลโก้ร้านหมูปิ้งบ้านสวน"> หมูปิ้งบ้านสวน</div>
        <p class="text-ink-soft" style="color:rgba(243,231,214,.7);font-size:.9rem;">หมูปิ้งสูตรบ้านๆ ปิ้งสดใหม่ทุกไม้ หอมควันไฟถ่านแท้ ส่งตรงถึงบ้านคุณทุกวัน</p>
        <div class="d-flex gap-2 mt-3">
          <a href="contact.html" class="social-dot" aria-label="Facebook">f</a>
          <a href="contact.html" class="social-dot" aria-label="LINE">L</a>
          <a href="contact.html" class="social-dot" aria-label="Instagram">IG</a>
        </div>
      </div>
      <div class="col-6 col-lg-2">
        <h5 class="h6">เมนู</h5>
        <ul class="list-unstyled d-flex flex-column gap-2 mt-3">
          <li><a href="index.html">หน้าแรก</a></li>
          <li><a href="products.html">สินค้า</a></li>
          <li><a href="promotions.html">โปรโมชัน</a></li>
          <li><a href="reviews.html">รีวิว</a></li>
        </ul>
      </div>
      <div class="col-6 col-lg-2">
        <h5 class="h6">บริการ</h5>
        <ul class="list-unstyled d-flex flex-column gap-2 mt-3">
          <li><a href="payment.html">วิธีชำระเงิน</a></li>
          <li><a href="contact.html">ติดต่อเรา</a></li>
        </ul>
      </div>
      <div class="col-lg-4">
        <h5 class="h6">ติดต่อ (ตัวอย่าง)</h5>
        <ul class="list-unstyled d-flex flex-column gap-2 mt-3" style="font-size:.92rem;">
          <li>📍 39 หมู่ 1 ถนนรังสิต-นครนายก ตำบลคลองหก อำเภอคลองหลวง จังหวัดปทุมธานี 12120</li>
          <li>📞 098-369-0789</li>
          <li>🕒 เปิดทุกวัน จันทร์–เสาร์ 15:00–22:00 น.</li>
        </ul>
      </div>
    </div>
    <div class="mt-4" style="font-size:.9rem;">
      <h5 class="h6">จัดการโดย</h5>
      <ul class="list-unstyled mb-0" style="color:rgba(243,231,214,.7);">
        <li>นายโสริยา ซุน 116710905101-7</li>
        <li>นายณัชพล งามสกุลธิติ 116710905082-9</li>
        <li>นายสุทิน สวงโท 116710905110-8</li>
        <li>ปัญญสิริย์ เกียรติภูมิวรากูล 116710905066-2</li>
      </ul>
    </div>
    <hr class="footer-line my-4">
    <div class="d-flex flex-wrap justify-content-between gap-2" style="font-size:.82rem;color:rgba(243,231,214,.6);">
      <span>© 2569 หมูปิ้งบ้านสวน — เว็บไซต์ตัวอย่างสำหรับสาธิต</span>
      <span>ทำด้วย ❤️ และควันไฟถ่าน</span>
    </div>
  </div>`;
  }

  /* ---------- star input builder ---------- */
  window.mpBuildStarInput = function(container, onChange){
    var value = 5;
    container.innerHTML = "";
    for(var i=1;i<=5;i++){
      var s = document.createElement("span");
      s.className = "star";
      s.textContent = "★";
      s.dataset.v = i;
      container.appendChild(s);
    }
    function render(){
      container.querySelectorAll(".star").forEach(function(s){
        s.classList.toggle("on", +s.dataset.v <= value);
      });
    }
    container.addEventListener("click", function(e){
      var s = e.target.closest(".star");
      if(!s) return;
      value = +s.dataset.v;
      render();
      if(onChange) onChange(value);
    });
    render();
    return { get:function(){ return value; }, set:function(v){ value=v; render(); } };
  };

  /* ---------- decorative QR-like grid (not a real payment QR) ---------- */
  window.mpBuildFakeQR = function(el, seed){
    el.innerHTML = "";
    var n = 49;
    var s = seed || 42;
    function rand(){ s = (s*1103515245 + 12345) & 0x7fffffff; return (s % 1000)/1000; }
    for(var i=0;i<n;i++){
      var cell = document.createElement("i");
      var edge = (i<7 || i>41 || i%7===0 || i%7===6);
      var on = edge ? (rand() > .3) : (rand() > .48);
      if(!on) cell.className = "off";
      el.appendChild(cell);
    }
  };

  /* ---------- countdown to next Fri 15:00–17:00 flash sale ---------- */
  window.mpStartFlashCountdown = function(cellIds){
    function nextWindow(){
      var now = new Date();
      var d = new Date(now);
      var day = d.getDay(); // 0 Sun .. 5 Fri
      var target = new Date(d);
      target.setHours(15,0,0,0);
      var diffDays = (5 - day + 7) % 7;
      if(diffDays === 0 && now >= target){
        var end = new Date(target); end.setHours(17,0,0,0);
        if(now <= end) return {active:true, end:end};
        diffDays = 7;
      }
      target.setDate(target.getDate()+diffDays);
      return {active:false, end:target};
    }
    function tick(){
      var w = nextWindow();
      var diff = Math.max(0, w.end - new Date());
      var d = Math.floor(diff/86400000);
      var h = Math.floor((diff%86400000)/3600000);
      var m = Math.floor((diff%3600000)/60000);
      var sec = Math.floor((diff%60000)/1000);
      if(cellIds.d) cellIds.d.textContent = String(d).padStart(2,"0");
      if(cellIds.h) cellIds.h.textContent = String(h).padStart(2,"0");
      if(cellIds.m) cellIds.m.textContent = String(m).padStart(2,"0");
      if(cellIds.s) cellIds.s.textContent = String(sec).padStart(2,"0");
      if(cellIds.label) cellIds.label.textContent = w.active ? "กำลังลดราคาอยู่ตอนนี้! หมดเขตใน" : "เริ่ม Flash Sale ครั้งถัดไปในอีก";
    }
    tick();
    return setInterval(tick, 1000);
  };

  document.addEventListener("DOMContentLoaded", function(){
    markActiveNav();
    syncFooter();
    Cart.renderBadge();
    Cart.renderDrawer();
    var closers = document.querySelectorAll("[data-cart-close]");
    closers.forEach(function(c){ c.addEventListener("click", window.mpCloseCart); });
    var openers = document.querySelectorAll("[data-cart-open]");
    openers.forEach(function(c){ c.addEventListener("click", function(e){ e.preventDefault(); window.mpOpenCart(); }); });
  });
})();
