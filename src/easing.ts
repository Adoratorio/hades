const Easings = {
  LINEAR: (t : number) => t,
  QUAD: (t : number) => t*(2-t),
  CUBIC: (t : number) => (--t)*t*t+1,
  QUART: (t : number) => 1-(--t)*t*t*t,
  QUINT: (t : number) => 1+(--t)*t*t*t*t,
}

export default Easings;