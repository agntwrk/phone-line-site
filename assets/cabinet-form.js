(function () {
  "use strict";
  var loaded = Date.now();
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }
  function note(form, text, isError) {
    var el = form.querySelector("[data-cabinet-note]");
    if (!el) {
      el = document.createElement("p");
      el.setAttribute("data-cabinet-note", "");
      form.appendChild(el);
    }
    el.setAttribute("role", isError ? "alert" : "status");
    el.textContent = text;
  }
  function values(form) {
    var out = {};
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name || field.disabled) return;
      var type = (field.type || "").toLowerCase();
      if (type === "submit" || type === "button" || type === "reset" || type === "file" || type === "image") return;
      if ((type === "checkbox" || type === "radio") && !field.checked) return;
      out[field.name] = out[field.name] ? out[field.name] + ", " + field.value : field.value;
    });
    return out;
  }
  ready(function () {
    Array.prototype.forEach.call(document.querySelectorAll("form[data-cabinet-form]"), function (form) {
      var started = loaded;
      var timer = form.querySelector('input[name="t"]');
      if (!timer) {
        timer = document.createElement("input");
        timer.type = "hidden";
        timer.name = "t";
        form.appendChild(timer);
      }
      timer.value = String(started);
      form.addEventListener("focusin", function first() {
        started = Date.now();
        timer.value = String(started);
        form.removeEventListener("focusin", first);
      });
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var button = form.querySelector('[type="submit"]');
        if (button) button.disabled = true;
        fetch(form.action, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(values(form)),
        })
          .then(function (response) {
            if (response.ok) {
              var thanks = form.getAttribute("data-thanks") || "Thank you. Your message was sent.";
              form.textContent = "";
              note(form, thanks, false);
              return;
            }
            if (button) button.disabled = false;
            note(form, response.status === 429 ? "Too many messages just now. Please try again later." : "Your message could not be sent. Please check the form and try again.", true);
          })
          .catch(function () {
            form.submit();
          });
      });
    });
  });
})();
