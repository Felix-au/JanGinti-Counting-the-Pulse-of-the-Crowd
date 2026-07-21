/**
 * Modal.js — Custom Dark Glassmorphism Modal Component.
 * Replaces native browser alert(), confirm(), and prompt() dialogs.
 */

export class Modal {
  static _createOverlay() {
    let overlay = document.getElementById('modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'modal-overlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  static close() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.innerHTML = '';
      }, 200);
    }
  }

  static alert({ title = 'Notification', message = '', icon = 'ℹ️' }) {
    return new Promise((resolve) => {
      const overlay = this._createOverlay();
      overlay.innerHTML = `
        <div class="modal-box glass-panel animate-pop">
          <div class="modal-header">
            <span class="modal-title"><span class="modal-icon">${icon}</span> ${title}</span>
            <button class="btn-icon modal-close-btn" title="Close">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-message">${message}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary modal-btn-ok">OK</button>
          </div>
        </div>
      `;

      requestAnimationFrame(() => overlay.classList.add('active'));

      const closeFn = () => {
        this.close();
        resolve(true);
      };

      overlay.querySelector('.modal-close-btn').addEventListener('click', closeFn);
      overlay.querySelector('.modal-btn-ok').addEventListener('click', closeFn);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeFn();
      });
    });
  }

  static confirm({ title = 'Confirm Action', message = 'Are you sure?', confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) {
    return new Promise((resolve) => {
      const overlay = this._createOverlay();
      overlay.innerHTML = `
        <div class="modal-box glass-panel animate-pop">
          <div class="modal-header">
            <span class="modal-title"><span class="modal-icon">${danger ? '⚠️' : '❓'}</span> ${title}</span>
            <button class="btn-icon modal-close-btn" title="Close">✕</button>
          </div>
          <div class="modal-body">
            <p class="modal-message">${message}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary modal-btn-cancel">${cancelText}</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} modal-btn-confirm">${confirmText}</button>
          </div>
        </div>
      `;

      requestAnimationFrame(() => overlay.classList.add('active'));

      const onConfirm = () => { this.close(); resolve(true); };
      const onCancel = () => { this.close(); resolve(false); };

      overlay.querySelector('.modal-close-btn').addEventListener('click', onCancel);
      overlay.querySelector('.modal-btn-cancel').addEventListener('click', onCancel);
      overlay.querySelector('.modal-btn-confirm').addEventListener('click', onConfirm);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) onCancel();
      });
    });
  }

  static prompt({ title = 'Input Required', message = '', defaultValue = '', placeholder = '', confirmText = 'Submit' }) {
    return new Promise((resolve) => {
      const overlay = this._createOverlay();
      overlay.innerHTML = `
        <div class="modal-box glass-panel animate-pop">
          <div class="modal-header">
            <span class="modal-title"><span class="modal-icon">✏️</span> ${title}</span>
            <button class="btn-icon modal-close-btn" title="Close">✕</button>
          </div>
          <div class="modal-body">
            ${message ? `<p class="modal-message">${message}</p>` : ''}
            <input type="text" class="input modal-input" value="${defaultValue}" placeholder="${placeholder}" autofocus />
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary modal-btn-cancel">Cancel</button>
            <button class="btn btn-primary modal-btn-confirm">${confirmText}</button>
          </div>
        </div>
      `;

      requestAnimationFrame(() => overlay.classList.add('active'));

      const input = overlay.querySelector('.modal-input');
      input.focus();
      input.select();

      const onConfirm = () => {
        const val = input.value.trim();
        this.close();
        resolve(val);
      };
      const onCancel = () => { this.close(); resolve(null); };

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') onConfirm();
        if (e.key === 'Escape') onCancel();
      });

      overlay.querySelector('.modal-close-btn').addEventListener('click', onCancel);
      overlay.querySelector('.modal-btn-cancel').addEventListener('click', onCancel);
      overlay.querySelector('.modal-btn-confirm').addEventListener('click', onConfirm);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) onCancel();
      });
    });
  }

  static shortcutsModal() {
    return new Promise((resolve) => {
      const overlay = this._createOverlay();
      overlay.innerHTML = `
        <div class="modal-box glass-panel animate-pop modal-wide">
          <div class="modal-header">
            <span class="modal-title"><span class="modal-icon">⌨️</span> Keyboard Shortcuts</span>
            <button class="btn-icon modal-close-btn" title="Close">✕</button>
          </div>
          <div class="modal-body">
            <table class="shortcuts-table">
              <thead>
                <tr><th>Key</th><th>Action</th></tr>
              </thead>
              <tbody>
                <tr><td><kbd>1</kbd></td><td>Select & Move Mode</td></tr>
                <tr><td><kbd>2</kbd></td><td>Add Area Mode</td></tr>
                <tr><td><kbd>3</kbd></td><td>Connect Path Mode</td></tr>
                <tr><td><kbd>4</kbd></td><td>Delete Mode</td></tr>
                <tr><td><kbd>Esc</kbd></td><td>Clear Selection / Reset Mode</td></tr>
                <tr><td><kbd>Del</kbd> / <kbd>Backspace</kbd></td><td>Delete Selected Area or Path</td></tr>
              </tbody>
            </table>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary modal-btn-ok">Got It</button>
          </div>
        </div>
      `;

      requestAnimationFrame(() => overlay.classList.add('active'));

      const closeFn = () => { this.close(); resolve(true); };
      overlay.querySelector('.modal-close-btn').addEventListener('click', closeFn);
      overlay.querySelector('.modal-btn-ok').addEventListener('click', closeFn);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) closeFn(); });
    });
  }

  static ruleDialog(area) {
    return new Promise((resolve) => {
      const overlay = this._createOverlay();
      overlay.innerHTML = `
        <div class="modal-box glass-panel animate-pop modal-wide">
          <div class="modal-header">
            <span class="modal-title"><span class="modal-icon">⚙️</span> Create Rule for ${area.name}</span>
            <button class="btn-icon modal-close-btn" title="Close">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Rule Type</label>
              <select id="rule-type-select" class="input">
                <option value="MIN_PATHS">Min Paths (Always keep minimum N paths open)</option>
                <option value="THRESHOLD">Capacity Threshold (Open paths dynamically as count increases)</option>
              </select>
            </div>

            <div id="rule-options-minpaths" class="rule-type-options">
              <div class="form-group">
                <label>Direction</label>
                <select id="minpaths-direction" class="input">
                  <option value="outgoing">Outgoing Paths</option>
                  <option value="incoming">Incoming Paths</option>
                  <option value="both">Both Directions</option>
                </select>
              </div>
              <div class="form-group">
                <label>Minimum Paths to Keep Open</label>
                <input type="number" id="minpaths-count" class="input" value="1" min="1" max="10" />
              </div>
            </div>

            <div id="rule-options-threshold" class="rule-type-options" style="display:none">
              <div class="form-group">
                <label>Direction</label>
                <select id="threshold-direction" class="input">
                  <option value="outgoing">Outgoing Paths</option>
                  <option value="incoming">Incoming Paths</option>
                  <option value="both">Both Directions</option>
                </select>
              </div>
              <div class="form-group">
                <label>Count Threshold (≥ People)</label>
                <input type="number" id="threshold-value" class="input" value="500" min="10" step="50" />
              </div>
              <div class="form-group">
                <label>Required Paths Open</label>
                <input type="number" id="threshold-paths" class="input" value="2" min="1" max="10" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary modal-btn-cancel">Cancel</button>
            <button class="btn btn-primary modal-btn-confirm">Add Rule</button>
          </div>
        </div>
      `;

      requestAnimationFrame(() => overlay.classList.add('active'));

      const typeSelect = overlay.querySelector('#rule-type-select');
      const minOpts = overlay.querySelector('#rule-options-minpaths');
      const threshOpts = overlay.querySelector('#rule-options-threshold');

      typeSelect.addEventListener('change', () => {
        if (typeSelect.value === 'MIN_PATHS') {
          minOpts.style.display = 'block';
          threshOpts.style.display = 'none';
        } else {
          minOpts.style.display = 'none';
          threshOpts.style.display = 'block';
        }
      });

      const onCancel = () => { this.close(); resolve(null); };
      const onConfirm = () => {
        const type = typeSelect.value;
        let ruleData = null;

        if (type === 'MIN_PATHS') {
          const dir = overlay.querySelector('#minpaths-direction').value;
          const min = parseInt(overlay.querySelector('#minpaths-count').value) || 1;
          ruleData = {
            areaId: area.id,
            type: 'MIN_PATHS',
            direction: dir,
            minPaths: min,
            description: `Always keep at least ${min} ${dir} path(s) open`,
          };
        } else {
          const dir = overlay.querySelector('#threshold-direction').value;
          const thresh = parseInt(overlay.querySelector('#threshold-value').value) || 500;
          const paths = parseInt(overlay.querySelector('#threshold-paths').value) || 2;
          ruleData = {
            areaId: area.id,
            type: 'THRESHOLD',
            direction: dir,
            conditions: [{ threshold: thresh, minPaths: paths, direction: dir }],
            description: `≥${thresh} people: ${paths} ${dir} path(s) required`,
          };
        }

        this.close();
        resolve(ruleData);
      };

      overlay.querySelector('.modal-close-btn').addEventListener('click', onCancel);
      overlay.querySelector('.modal-btn-cancel').addEventListener('click', onCancel);
      overlay.querySelector('.modal-btn-confirm').addEventListener('click', onConfirm);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) onCancel(); });
    });
  }
}
