import { initials } from './mates.js';

// Your photo if you've added one, otherwise your initials.
export default function Avatar({ name, photo }) {
  return photo ? <img src={photo} alt="" /> : initials(name);
}
