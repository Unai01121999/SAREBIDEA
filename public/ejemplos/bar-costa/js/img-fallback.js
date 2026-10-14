document.addEventListener('error', function (e) {
  var i = e.target;
  if (i && i.tagName === 'IMG') i.style.visibility = 'hidden';
}, true);
