import '../svelte-lab-avatar/lib/base.css';
import './cytosis.css';
import CytosisPrototype from './cytosis-prototype.svelte';
import { mount } from 'svelte';

const target = document.getElementById('app');

if (!target) {
  throw new Error('Missing #app mount target');
}

const app = mount(CytosisPrototype, { target });

export default app;
