/**
 * Creates a event handler which mutually exclusively responds to either a single or double (or higher) click/tap.
 * Copyright (c)2012 Stephen M. McKamey.
 * Licensed under The MIT License.
 *
 * modified Code from: https://github.com/mckamey/doubleTap.js
 *
 * @param {function...} actions the possible actions to take in order by number of clicks
 * @param {number} speed max delay between multi-clicks in milliseconds (optional, default: 300ms)
 * @return {function(Event)} mutually exclusive event handler
 */
export var doubleClick = function () {
  "use strict";
  var actions = Array.prototype.slice.call(arguments);
  var speed = 200;
  if (typeof actions[actions.length - 1] === "number") {
    speed = Math.abs(+actions[--actions.length]) || speed;
  }
  var pendingClick = 0;
  var kill = function () {
    if (pendingClick) {
      clearTimeout(pendingClick);
      pendingClick = 0;
    }
  };
  var xor = function (e) {
    e = e || window.event;
    kill();
    var action = actions[e.detail - 1];
    if (typeof action === "function") {
      if (e.detail < actions.length) {
        pendingClick = setTimeout(
          function () {
            action.call(this, e);
          }.bind(this),
          speed
        );
      } else action.call(this, e);
    }
  };
  xor.kill = kill;
  return xor;
};
