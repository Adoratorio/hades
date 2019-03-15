const Easings = {
  LINEAR: (t : number) => t,
  IN_QUAD: (t : number) => t*t,
  OUT_QUAD: (t : number) => t*(2-t),
  IN_OUT_QUAD: (t : number) => t<.5 ? 2*t*t : -1+(4-2*t)*t,
  IN_CUBIC: (t : number) => t*t*t,
  OUT_CUBIC: (t : number) => (--t)*t*t+1,
  IN_OUT_CUBIC: (t : number) => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1,
  IN_QUART: (t : number) => t*t*t*t,
  OUT_QUART: (t : number) => 1-(--t)*t*t*t,
  IN_OUT_QUART: (t : number) => t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t,
  IN_QUINT: (t : number) => t*t*t*t*t,
  OUT_QUINT: (t : number) => 1+(--t)*t*t*t*t,
  IN_OUT_QUINT: (t : number) => t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t,
}

export default Easings;