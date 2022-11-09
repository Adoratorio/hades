const TRACK_BG = 'rgba(222, 222, 222, .75)';
const THUMB_BG = 'rgba(0, 0, 0, .5)';

const style = `
.scrollbar__wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
[data-scrollbar] {
  display: block;
  position: absolute;
  z-index: 1;
  opacity: 0;
  background: ${TRACK_BG};
  pointer-events: auto;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
    user-select: none;

  -webkit-transition: opacity 0.5s 0.5s ease-out;
    transition: opacity 0.5s 0.5s ease-out;
}
[data-scrollbar="track-x"] {
  left: 0;
  bottom: 0;
  width: 100%;
  height: 8px;
}
[data-scrollbar="track-y"] {
  top: 0;
  right: 0;
  width: 8px;
  height: 100%;
}
[data-scrollbar].show,
[data-scrollbar]:hover {
  opacity: 1;
  -webkit-transition-delay: 0s;
    transition-delay: 0s;
}
.scrollbar__thumb {
  position: absolute;
  top: 0;
  left: 0;
  background: ${THUMB_BG};
  border-radius: 4px;
}
[data-scrollbar="track-x"] .scrollbar__thumb {
  width: 100px;
  height: 8px;
}
[data-scrollbar="track-y"] .scrollbar__thumb {
  width: 8px;
  height: 100px;
}
`;

export default style;