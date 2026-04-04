# Air Table Experiment Simulations

An interactive browser-based physics simulation suite designed for air table experiment sets. Visualize and analyze classical mechanics experiments in real time, with support for both Turkish and English.

## Experiments

### Collision
Simulate elastic collisions between multiple balls on a tilting rectangular surface. Configure each ball's mass, speed, direction, and color. Export the trajectory map as a scaled A4 PNG for lab reports.

### Free Fall
Drop an object from a configurable height under gravity. Toggle bouncing with adjustable energy loss. Plots a real-time position–time graph and reports final velocity and energy values.

### Projectile Motion
Launch a projectile with a given initial velocity and angle. Supports a tilting table (effective gravity: `g_eff = g × sin(θ)`), optional air resistance, and trace mode. Compares theoretical vs. actual range, flight time, and maximum height. Exports graphs and raw CSV data.

### Pendulum
Single pendulum simulation using 4th-order Runge-Kutta integration. Adjustable length, mass, initial angle, damping, and table tilt. Plots angle–time, angular velocity–time, energy–time, and phase space graphs in real time.


## Features

- **Bilingual UI** — switch between Turkish and English at any time via the language buttons
- **Real-time graphs** — position, velocity, energy, and phase space plots update every frame
- **Table angle simulation** — all experiments support a tilting air table that scales effective gravity
- **Export** — save graphs as PNG and data as CSV
- **Trace mode** — visualize the full trajectory path on the canvas
- **No dependencies** — pure HTML, CSS, and vanilla JavaScript; open `experiments.html` directly in any browser

## Usage

```
git clone https://github.com/BahtiyarCina/Simulations-of-Air-Table-Experiments.git
```

Open `experiments.html` in a browser. No build step or server required.

## File Structure

```
experiments.html   # Main application (all experiments)
pendulum.js        # Pendulum simulation (RK4 integration)
projectile.js      # Projectile motion simulation
freefall.js        # Free fall & bouncing simulation
collision.js       # Collision & ball trajectory simulation
i18n.js            # Internationalization system
en.json            # English translations
tr.json            # Turkish translations
```

## Physics Notes

| Experiment | Key Formula |
|---|---|
| Pendulum period (small angle) | `T = 2π √(L / g_eff)` |
| Effective gravity | `g_eff = g × sin(θ)` |
| Projectile range | `R = v₀ cos(α) × t_flight` |
| Kinetic energy | `KE = ½ m v²` |
| Potential energy | `PE = m g h` |

## License

MIT
