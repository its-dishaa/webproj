/*
  script.js
  - Contains all app behavior for the resume builder.
  - Manages state, form UI, preview rendering, ATS scoring, and optional AI helpers.
  - This file is written with sectioned helper functions to be easy to follow.
*/

// -----------------------------------------------------------------------------
// App state (single source of truth)
// -----------------------------------------------------------------------------
const appState = {
  currentTemplate: 1,
  skills: [],
  experiences: [],
  educations: [],
  projects: [],
  photoDataURL: '',
  accentColor: '#2d2226',
  resumeSizePx: 14,
  resumeFontFamily: 'Georgia, serif',
};

// -----------------------------------------------------------------------------
// DOM utility helpers (short wrappers)
// -----------------------------------------------------------------------------
const $ = (selector) => document.querySelector(selector);
const $all = (selector) => Array.from(document.querySelectorAll(selector));

const setText = (selector, text) => { const el = $(selector); if (el) el.textContent = text; };

// -----------------------------------------------------------------------------
// BASIC NAVIGATION
// -----------------------------------------------------------------------------
function goTo(screenName) {
  $all('.screen').forEach((section) => section.classList.remove('active'));
  const target = $(`#screen-${screenName}`);
  if (target) target.classList.add('active');
  window.scrollTo(0, 0);
}

function selectTemplate(templateId) {
  appState.currentTemplate = templateId;
  const labels = {
    1: 'Template 1 � Clean Professional',
    2: 'Template 2 � Two-Column Sidebar',
    3: 'Template 3 � Modern Minimal',
  };

  setText('#form-template-label', labels[templateId] || 'Template 1 � Clean Professional');

  // Template 2 needs a photo field; others do not.
  const photoContainer = $('#photo-field');
  if (photoContainer) photoContainer.style.display = templateId === 2 ? 'flex' : 'none';

  // Ensure default one record exists in each section.
  if (appState.experiences.length === 0) addExperience();
  if (appState.educations.length === 0) addEducation();
  if (appState.projects.length === 0) addProject();

  goTo('form');
}

function scrollToSection(sectionId) {
  const target = document.getElementById(sectionId);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// -----------------------------------------------------------------------------
// DYNAMIC FORM ENTRY MANAGEMENT
// -----------------------------------------------------------------------------
function addExperience() {
  appState.experiences.push({});
  renderExperiences();
}

function renderExperiences() {
  const container = $('#exp-entries');
  if (!container) return;

  container.innerHTML = '';
  appState.experiences.forEach((_, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'entry-block';
    wrapper.id = `exp-${index}`;

    wrapper.innerHTML = `
      <span class="entry-num">#${index + 1}</span>
      ${index > 0 ? `<button class="remove-btn" onclick="removeEntry('exp', ${index})">?</button>` : ''}
      <div class="field-row">
        <div class="field"><label>Job Title</label><input type="text" id="exp-title-${index}" placeholder="Software Engineer" oninput="liveScore()"></div>
        <div class="field"><label>Company</label><input type="text" id="exp-company-${index}" placeholder="Infosys Ltd." oninput="liveScore()"></div>
      </div>
      <div class="field-row triple">
        <div class="field"><label>Start Date</label><input type="month" id="exp-start-${index}"></div>
        <div class="field"><label>End Date</label><input type="month" id="exp-end-${index}"></div>
        <div class="field"><label>Currently Here?</label><select id="exp-current-${index}" onchange="toggleCurrentJob(${index})"><option value="">No</option><option value="yes">Yes � Present</option></select></div>
      </div>
      <div class="field">
        <label>Description</label>
        <textarea id="exp-desc-${index}" rows="3" placeholder="• Achieved ..." oninput="liveScore()"></textarea>
      </div>
    `;

    container.appendChild(wrapper);
  });
}

function addEducation() {
  appState.educations.push({});
  renderEducations();
}

function renderEducations() {
  const container = $('#edu-entries');
  if (!container) return;

  container.innerHTML = '';
  appState.educations.forEach((_, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'entry-block';
    wrapper.innerHTML = `
      <span class="entry-num">#${index + 1}</span>
      ${index > 0 ? `<button class="remove-btn" onclick="removeEntry('edu', ${index})">?</button>` : ''}
      <div class="field-row">
        <div class="field"><label>Institution</label><input type="text" id="edu-school-${index}" placeholder="IIT Delhi" oninput="liveScore()"></div>
        <div class="field"><label>Degree</label><input type="text" id="edu-degree-${index}" placeholder="B.Tech Computer Science" oninput="liveScore()"></div>
      </div>
      <div class="field-row triple">
        <div class="field"><label>Start Year</label><input type="text" id="edu-start-${index}" placeholder="2018"></div>
        <div class="field"><label>End Year</label><input type="text" id="edu-end-${index}" placeholder="2022"></div>
        <div class="field"><label>Grade / CGPA</label><input type="text" id="edu-grade-${index}" placeholder="8.5 CGPA"></div>
      </div>
    `;

    container.appendChild(wrapper);
  });
}

function addProject() {
  appState.projects.push({});
  renderProjects();
}

function renderProjects() {
  const container = $('#proj-entries');
  if (!container) return;

  container.innerHTML = '';
  appState.projects.forEach((_, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'entry-block';
    wrapper.innerHTML = `
      <span class="entry-num">#${index + 1}</span>
      ${index > 0 ? `<button class="remove-btn" onclick="removeEntry('proj', ${index})">?</button>` : ''}
      <div class="field-row">
        <div class="field"><label>Project Name</label><input type="text" id="proj-name-${index}" placeholder="E-Commerce Platform"></div>
        <div class="field"><label>Tech Stack</label><input type="text" id="proj-stack-${index}" placeholder="React, Node.js, MongoDB"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Description</label><textarea id="proj-desc-${index}" rows="2" placeholder="Built..." oninput="liveScore()"></textarea></div>
        <div class="field"><label>Link (optional)</label><input type="url" id="proj-link-${index}" placeholder="github.com/..." oninput="liveScore()"></div>
      </div>
    `;

    container.appendChild(wrapper);
  });
}

function removeEntry(type, index) {
  if (type === 'exp') appState.experiences.splice(index, 1);
  if (type === 'edu') appState.educations.splice(index, 1);
  if (type === 'proj') appState.projects.splice(index, 1);

  renderExperiences();
  renderEducations();
  renderProjects();

  liveScore();
}

function toggleCurrentJob(index) {
  const presentSelect = $(`#exp-current-${index}`);
  const endDateInput = $(`#exp-end-${index}`);
  const isCurrent = presentSelect?.value === 'yes';
  if (!endDateInput) return;

  endDateInput.disabled = isCurrent;
  if (isCurrent) endDateInput.value = '';
}

// -----------------------------------------------------------------------------
// SKILLS INPUT MANAGEMENT
// -----------------------------------------------------------------------------
function handleSkillInput(event) {
  const input = event.target;

  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault();
    const skill = input.value.trim().replace(/,$/, '');
    if (skill && !appState.skills.includes(skill)) {
      appState.skills.push(skill);
      renderSkills();
      liveScore();
    }
    input.value = '';
  }

  if (event.key === 'Backspace' && input.value === '' && appState.skills.length > 0) {
    appState.skills.pop();
    renderSkills();
    liveScore();
  }
}

function renderSkills() {
  const container = $('#skills-wrap');
  const input = $('#skill-input');
  if (!container || !input) return;

  container.innerHTML = '';

  appState.skills.forEach((skill, i) => {
    const tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.innerHTML = `${skill} <span class="del" onclick="removeSkill(${i})">�</span>`;
    container.appendChild(tag);
  });

  container.appendChild(input);
}

function removeSkill(index) {
  appState.skills.splice(index, 1);
  renderSkills();
  liveScore();
}

// -----------------------------------------------------------------------------
// PHOTO PASSPORT
// -----------------------------------------------------------------------------
function handlePhoto(input) {
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => { appState.photoDataURL = e.target?.result || ''; };
  reader.readAsDataURL(file);
}

// -----------------------------------------------------------------------------
// TEXT HELPERS
// -----------------------------------------------------------------------------
function safeText(text) {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function bulletsToList(text) {
  if (!text) return '';
  return text
    .split('\n')
    .map((line) => line.trim().replace(/^[�\-*]\s*/, ''))
    .filter(Boolean)
    .map((line) => `<li>${safeText(line)}</li>`)
    .join('');
}

function formatDateField(value) {
  if (!value) return '';
  if (value === 'Present') return 'Present';

  const [year, month] = value.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return monthNames[parseInt(month, 10) - 1] ? `${monthNames[parseInt(month, 10) - 1]} ${year}` : value;
}

// -----------------------------------------------------------------------------
// ATS SCORE + FORM STATUS
// -----------------------------------------------------------------------------
function computeATSCriteria() {
  const name = $('#f-name')?.value || '';
  const email = $('#f-email')?.value || '';
  const phone = $('#f-phone')?.value || '';
  const summary = $('#f-summary')?.value || '';
  const firstExpTitle = $('#exp-title-0')?.value || '';
  const firstExpDesc = $('#exp-desc-0')?.value || '';
  const firstEdu = $('#edu-school-0')?.value || '';

  return [
    { label: 'Name & contact info', pass: name.length > 1 && email.length > 4 && phone.length > 5, points: 15 },
    { label: 'Professional summary', pass: summary.length > 60, warn: summary.length > 20 && summary.length <= 60, points: 15 },
    { label: 'Work experience added', pass: firstExpTitle.length > 1, points: 20 },
    { label: 'Experience descriptions', pass: firstExpDesc.length > 50, warn: firstExpDesc.length > 10 && firstExpDesc.length <= 50, points: 10 },
    { label: 'Education details', pass: firstEdu.length > 1, points: 15 },
    { label: '5+ skills listed', pass: appState.skills.length >= 5, warn: appState.skills.length >= 2 && appState.skills.length < 5, points: 15 },
    { label: 'Action verbs in experience', pass: /\b(led|built|developed|increased|managed|created|designed|improved|launched|reduced|achieved|delivered|optimized|implemented|collaborated)\b/i.test(firstExpDesc), points: 10 },
  ];
}

function updateUIFromScore() {
  const checks = computeATSCriteria();
  const score = checks.reduce((total, item) => total + (item.pass ? item.points : 0), 0);

  // Set ring and numeric score
  const ring = $('#score-ring');
  if (ring) {
    ring.style.strokeDashoffset = `${251 - (251 * score) / 100}`;
    ring.style.stroke = score >= 75 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626';
  }

  setText('#score-num', `${score}`);
  setText('#final-score-num', `${score}`);

  const box = $('#final-score-box');
  if (box) {
    box.style.background = score >= 75 ? 'var(--success-soft)' : score >= 50 ? 'var(--warn-soft)' : 'var(--danger-soft)';
    const scoreText = box.querySelector('.score');
    if (scoreText) scoreText.style.color = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warn)' : 'var(--danger)';
  }

  // Render check list
  const checksContainer = $('#ats-checks');
  if (checksContainer) {
    checksContainer.innerHTML = checks
      .map((item) => {
        const status = item.pass ? 'pass' : item.warn ? 'warn' : 'fail';
        const icon = item.pass ? '?' : item.warn ? '!' : '?';
        return `<div class="ats-check ${status}"><span class="ats-check-icon">${icon}</span><span class="ats-check-text">${item.label}</span></div>`;
      })
      .join('');
  }

  // Progress bar / nav section marks
  const progress = Math.max(5, Math.min(100, score));
  const label = progress < 30 ? 'Just getting started' : progress < 55 ? 'Looking good so far' : progress < 75 ? 'Almost there!' : 'ATS-Ready! ??';

  if ($('#prog-fill')) $('#prog-fill').style.width = `${progress}%`;
  setText('#prog-label', label);

  markSection('personal', ($('#f-name')?.value || '').length > 1);
  markSection('summary', ($('#f-summary')?.value || '').length > 30);
  markSection('experience', ($('#exp-title-0')?.value || '').length > 1);
  markSection('education', ($('#edu-school-0')?.value || '').length > 1);
  markSection('skills', appState.skills.length >= 3);
}

function markSection(sectionName, done) {
  const item = $(`[data-sec="${sectionName}"]`);
  if (!item) return;
  item.classList.toggle('done', done);
}

function liveScore() {
  updateUIFromScore();
}

// -----------------------------------------------------------------------------
// Form data collection and rendering of resume previews
// -----------------------------------------------------------------------------
function collectFormData() {
  const formData = {
    name: $('#f-name')?.value || '',
    role: $('#f-role')?.value || '',
    email: $('#f-email')?.value || '',
    phone: $('#f-phone')?.value || '',
    location: $('#f-location')?.value || '',
    linkedin: $('#f-linkedin')?.value || '',
    portfolio: $('#f-portfolio')?.value || '',
    summary: $('#f-summary')?.value || '',
    languages: $('#f-languages')?.value || '',
    certs: $('#f-certs')?.value || '',
    awards: $('#f-awards')?.value || '',
    volunteer: $('#f-volunteer')?.value || '',
    hobbies: $('#f-hobbies')?.value || '',
    photo: appState.photoDataURL,
    skills: [...appState.skills],
    experiences: appState.experiences
      .map((_, i) => ({
        title: $(`#exp-title-${i}`)?.value || '',
        company: $(`#exp-company-${i}`)?.value || '',
        start: $(`#exp-start-${i}`)?.value || '',
        end: $(`#exp-current-${i}`)?.value === 'yes' ? 'Present' : $(`#exp-end-${i}`)?.value || '',
        desc: $(`#exp-desc-${i}`)?.value || '',
      }))
      .filter((exp) => exp.title || exp.company),
    educations: appState.educations
      .map((_, i) => ({
        school: $(`#edu-school-${i}`)?.value || '',
        degree: $(`#edu-degree-${i}`)?.value || '',
        start: $(`#edu-start-${i}`)?.value || '',
        end: $(`#edu-end-${i}`)?.value || '',
        grade: $(`#edu-grade-${i}`)?.value || '',
      }))
      .filter((edu) => edu.school),
    projects: appState.projects
      .map((_, i) => ({
        name: $(`#proj-name-${i}`)?.value || '',
        stack: $(`#proj-stack-${i}`)?.value || '',
        desc: $(`#proj-desc-${i}`)?.value || '',
        link: $(`#proj-link-${i}`)?.value || '',
      }))
      .filter((project) => project.name),
  };

  return formData;
}
function buildResume() {
  const data = collectFormData(); // get all form data
  const template = localStorage.getItem("selectedTemplate") || 1;

  let html = "";

  if (template == 1) {
    html = buildTemplateOne(data);
  } else if (template == 2) {
    html = buildTemplateTwo(data);
  } else if (template == 3) {
    html = buildTemplateThree(data);
  }

  document.getElementById("resume-output").innerHTML = html;

  applyRenderStyles(); // apply font + size

  goTo("preview"); // switch screen
}
function scrollToTemplates() {
  const section = document.getElementById("template-section");
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
}
function navigateTo(url) {
  document.body.classList.add('page-transitioning');
  window.setTimeout(() => { window.location.href = url; }, 260);
}

function goToJobs() {
  navigateTo("jobs.html");
}
function goToCoverLetter() {
  navigateTo("coverletter.html");
}

function applyRenderStyles() {
  const inner = $('#tpl-inner');
  if (!inner) return;
  inner.style.fontSize = `${appState.resumeSizePx}px`;
  inner.style.fontFamily = appState.resumeFontFamily;
}

// -----------------------------------------------------------------------------
// Resume templates (each returns HTML string for preview pane)
// -----------------------------------------------------------------------------
function buildTemplateOne(data) {
  const contact = [data.email, data.phone, data.location, data.linkedin, data.portfolio]
    .filter(Boolean)
    .join(' &nbsp;|&nbsp; ');

  const experienceHTML = data.experiences
    .map((exp) => {
      const dateRange = `${formatDateField(exp.start)}${exp.end ? ' � ' + formatDateField(exp.end) : ''}`;
      const descHTML = exp.desc ? `<ul class="t1-entry-body" style="padding-left:18px">${bulletsToList(exp.desc)}</ul>` : '';

      return `
        <div class="t1-entry">
          <div class="t1-entry-header">
            <span class="t1-entry-title">${safeText(exp.title)}</span>
            <span class="t1-entry-date">${safeText(dateRange)}</span>
          </div>
          <div class="t1-entry-sub">${safeText(exp.company)}</div>
          ${descHTML}
        </div>
      `;
    })
    .join('');

  const educationHTML = data.educations
    .map((edu) => `
      <div class="t1-entry">
        <div class="t1-entry-header">
          <span class="t1-entry-title">${safeText(edu.school)}</span>
          <span class="t1-entry-date">${safeText(`${edu.start}${edu.end ? ' � ' + edu.end : ''}`)}</span>
        </div>
        <div class="t1-entry-sub">${safeText(edu.degree)}${edu.grade ? ' &nbsp;�&nbsp; ' + safeText(edu.grade) : ''}</div>
      </div>
    `)
    .join('');

  const projectHTML = buildCommonProjectBlock(data);
  const certHTML = data.certs ? `<div class="t1-section"><div class="t1-section-title">Certifications</div><div class="t1-entry-body">${safeText(data.certs)}</div></div>` : '';
  const awardHTML = data.awards ? `<div class="t1-section"><div class="t1-section-title">Awards & Achievements</div><div class="t1-entry-body">${safeText(data.awards)}</div></div>` : '';

  const skillsHTML = data.skills.length
    ? `<div class="t1-section"><div class="t1-section-title">Skills</div><div class="t1-skills-list">${data.skills.map((s) => `<span class="t1-skill">${safeText(s)}</span>`).join('')}</div></div>`
    : '';

  const summaryHTML = data.summary ? `<div class="t1-section"><div class="t1-section-title">Professional Summary</div><div class="t1-summary">${safeText(data.summary)}</div></div>` : '';
  const languagesHTML = data.languages ? `<div class="t1-section"><div class="t1-section-title">Languages</div><div class="t1-entry-body">${safeText(data.languages)}</div></div>` : '';

  return `
    <div class="resume-t1" id="tpl-inner">
      <div class="t1-header">
        <div class="t1-name">${safeText(data.name)}</div>
        ${data.role ? `<div class="t1-title">${safeText(data.role)}</div>` : ''}
        <div class="t1-contact">${contact}</div>
      </div>
      ${summaryHTML}
      ${experienceHTML ? `<div class="t1-section"><div class="t1-section-title">Experience</div>${experienceHTML}</div>` : ''}
      ${educationHTML ? `<div class="t1-section"><div class="t1-section-title">Education</div>${educationHTML}</div>` : ''}
      ${skillsHTML}
      ${projectHTML}
      ${certHTML}
      ${awardHTML}
      ${languagesHTML}
    </div>
  `;
}

function buildTemplateTwo(data) {
  const photoHTML = data.photo
    ? `<img class="t2-photo" src="${safeText(data.photo)}" alt="Profile">`
    : `<div class="t2-photo-placeholder">??</div>`;

  const experienceHTML = data.experiences
    .map((exp) => {
      const dateRange = `${formatDateField(exp.start)}${exp.end ? ' � ' + formatDateField(exp.end) : ''}`;
      const desc = exp.desc ? `<ul class="t2-entry-body" style="padding-left:16px">${bulletsToList(exp.desc)}</ul>` : '';
      return `
        <div class="t2-entry">
          <div class="t2-entry-title">${safeText(exp.title)}</div>
          <div class="t2-entry-meta">${safeText(exp.company)} &nbsp;�&nbsp; ${safeText(dateRange)}</div>
          ${desc}
        </div>
      `;
    })
    .join('');

  const educationHTML = data.educations
    .map((edu) => `
      <div class="t2-entry">
        <div class="t2-entry-title">${safeText(edu.degree)}</div>
        <div class="t2-entry-meta">${safeText(edu.school)} � ${safeText(`${edu.start}${edu.end ? '�'+edu.end : ''}`)}${edu.grade ? ' � ' + safeText(edu.grade) : ''}</div>
      </div>
    `)
    .join('');

  const projectsHTML = deepProjectsHTML(data);
  const leftSidebar = `
    <div class="t2-sidebar" style="background:${appState.accentColor}">
      ${photoHTML}
      <div class="t2-sb-name">${safeText(data.name)}</div>
      ${data.role ? `<div class="t2-sb-title">${safeText(data.role)}</div>` : ''}
      <div class="t2-sb-section">
        <div class="t2-sb-head">Contact</div>
        ${data.email ? `<div class="t2-sb-item">? ${safeText(data.email)}</div>` : ''}
        ${data.phone ? `<div class="t2-sb-item">? ${safeText(data.phone)}</div>` : ''}
        ${data.location ? `<div class="t2-sb-item">?? ${safeText(data.location)}</div>` : ''}
        ${data.linkedin ? `<div class="t2-sb-item">?? ${safeText(data.linkedin)}</div>` : ''}
        ${data.portfolio ? `<div class="t2-sb-item">?? ${safeText(data.portfolio)}</div>` : ''}
      </div>
      ${data.skills.length ? `<div class="t2-sb-section"><div class="t2-sb-head">Skills</div>${data.skills.map((s) => `<div class="t2-sb-item">? ${safeText(s)}</div>`).join('')}</div>` : ''}
      ${data.languages ? `<div class="t2-sb-section"><div class="t2-sb-head">Languages</div><div class="t2-sb-item">${safeText(data.languages)}</div></div>` : ''}
      ${data.certs ? `<div class="t2-sb-section"><div class="t2-sb-head">Certifications</div><div class="t2-sb-item" style="font-size:11px">${safeText(data.certs)}</div></div>` : ''}
    </div>
  `;

  const mainContent = `
    <div class="t2-main">
      ${data.summary ? `<div class="t2-section"><div class="t2-section-head" style="color:${appState.accentColor};border-color:${appState.accentColor}">Profile</div><p class="t2-summary">${safeText(data.summary)}</p></div>` : ''}
      ${experienceHTML ? `<div class="t2-section"><div class="t2-section-head" style="color:${appState.accentColor};border-color:${appState.accentColor}">Experience</div>${experienceHTML}</div>` : ''}
      ${educationHTML ? `<div class="t2-section"><div class="t2-section-head" style="color:${appState.accentColor};border-color:${appState.accentColor}">Education</div>${educationHTML}</div>` : ''}
      ${projectsHTML}
      ${data.awards ? `<div class="t2-section"><div class="t2-section-head" style="color:${appState.accentColor};border-color:${appState.accentColor}">Awards</div><p class="t2-entry-body">${safeText(data.awards)}</p></div>` : ''}
    </div>
  `;

  return `
    <div class="resume-t2" id="tpl-inner">
      ${leftSidebar}
      ${mainContent}
    </div>
  `;
}

function buildTemplateThree(data) {
  const experienceHTML = data.experiences
    .map((exp) => `
      <div class="t3-entry">
        <div class="t3-entry-head">
          <span class="t3-entry-title">${safeText(exp.title)}</span>
          <span class="t3-entry-date">${safeText(`${formatDateField(exp.start)} � ${formatDateField(exp.end)}`)}</span>
        </div>
        <div class="t3-entry-sub">${safeText(exp.company)}</div>
        ${exp.desc ? `<ul class="t3-entry-body" style="padding-left:16px">${bulletsToList(exp.desc)}</ul>` : ''}
      </div>
    `)
    .join('');

  const educationHTML = data.educations
    .map((edu) => `
      <div class="t3-entry">
        <div class="t3-entry-head">
          <span class="t3-entry-title">${safeText(edu.school)}</span>
          <span class="t3-entry-date">${safeText(`${edu.start}${edu.end ? '�'+edu.end : ''}`)}</span>
        </div>
        <div class="t3-entry-sub">${safeText(edu.degree)}${edu.grade ? ' � ' + safeText(edu.grade) : ''}</div>
      </div>
    `)
    .join('');

  const projectHTML = deepProjectsHTML(data, 't3');

  const skillBlock = data.skills.length ? `<div class="t3-section"><div class="t3-section-head" style="color:${appState.accentColor}">Skills</div><div class="t3-skills-grid">${data.skills.map((s) => `<span class="t3-sk">${safeText(s)}</span>`).join('')}</div></div>` : '';

  return `
    <div class="resume-t3" id="tpl-inner">
      <div class="t3-top" style="background:${appState.accentColor}">
        <div class="t3-name">${safeText(data.name)}</div>
        ${data.role ? `<div class="t3-role">${safeText(data.role)}</div>` : ''}
        <div class="t3-contact-row">
          ${data.email ? `<span class="t3-ci">? ${safeText(data.email)}</span>` : ''}
          ${data.phone ? `<span class="t3-ci">? ${safeText(data.phone)}</span>` : ''}
          ${data.location ? `<span class="t3-ci">?? ${safeText(data.location)}</span>` : ''}
          ${data.linkedin ? `<span class="t3-ci">?? ${safeText(data.linkedin)}</span>` : ''}
          ${data.portfolio ? `<span class="t3-ci">?? ${safeText(data.portfolio)}</span>` : ''}
        </div>
      </div>
      <div class="t3-body">
        ${data.summary ? `<div class="t3-section"><div class="t3-section-head" style="color:${appState.accentColor}">Summary</div><p class="t3-summary">${safeText(data.summary)}</p></div>` : ''}
        <div class="t3-two-col">
          <div>
            ${experienceHTML ? `<div class="t3-section"><div class="t3-section-head" style="color:${appState.accentColor}">Experience</div>${experienceHTML}</div>` : ''}
            ${projectHTML}
          </div>
          <div>
            ${educationHTML ? `<div class="t3-section"><div class="t3-section-head" style="color:${appState.accentColor}">Education</div>${educationHTML}</div>` : ''}
            ${skillBlock}
            ${data.languages ? `<div class="t3-section"><div class="t3-section-head" style="color:${appState.accentColor}">Languages</div><p class="t3-entry-body">${safeText(data.languages)}</p></div>` : ''}
            ${data.certs ? `<div class="t3-section"><div class="t3-section-head" style="color:${appState.accentColor}">Certifications</div><p class="t3-entry-body">${safeText(data.certs)}</p></div>` : ''}
            ${data.awards ? `<div class="t3-section"><div class="t3-section-head" style="color:${appState.accentColor}">Awards</div><p class="t3-entry-body">${safeText(data.awards)}</p></div>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildCommonProjectBlock(data) {
  if (!data.projects || data.projects.length === 0) return '';
  return `
    <div class="t1-section">
      <div class="t1-section-title">Projects</div>
      ${data.projects
        .map((project) => `
          <div class="t1-entry">
            <div class="t1-entry-header">
              <span class="t1-entry-title">${safeText(project.name)}</span>
              ${project.link ? `<span class="t1-entry-date"><a href="${safeText(project.link)}" style="color:inherit">${safeText(project.link)}</a></span>` : ''}
            </div>
            ${project.stack ? `<div class="t1-entry-sub">${safeText(project.stack)}</div>` : ''}
            ${project.desc ? `<div class="t1-entry-body">${safeText(project.desc)}</div>` : ''}
          </div>
        `)
        .join('')}
    </div>
  `;
}

function deepProjectsHTML(data, templateKey = 't2') {
  if (!data.projects || data.projects.length === 0) return '';

  const sepClass = templateKey === 't3' ? 't3-section' : 't2-section';
  const headClass = templateKey === 't3' ? 't3-section-head' : 't2-section-head';

  return `
    <div class="${sepClass}">
      <div class="${headClass}" style="color:${appState.accentColor}; border-color:${appState.accentColor}">Projects</div>
      ${data.projects
        .map((project) => `
          <div class="${templateKey}-entry">
            <div class="${templateKey}-entry-head"><span class="${templateKey}-entry-title">${safeText(project.name)}</span></div>
            ${project.stack ? `<div class="${templateKey}-entry-sub">${safeText(project.stack)}</div>` : ''}
            ${project.desc ? `<div class="${templateKey}-entry-body">${safeText(project.desc)}</div>` : ''}
          </div>
        `)
        .join('')}
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Live preview customization
// -----------------------------------------------------------------------------
function setAccent(color, element) {
  appState.accentColor = color;
  $all('.color-swatch').forEach((swatch) => swatch.classList.remove('active'));
  if (element) element.classList.add('active');
  buildResume();
}

function setFont(fontFamily, element) {
  appState.resumeFontFamily = fontFamily;
  $all('.font-btn').forEach((btn) => btn.classList.remove('active'));
  if (element) element.classList.add('active');
  const inner = $('#tpl-inner');
  if (inner) inner.style.fontFamily = fontFamily;
}

function adjustFontSize(delta) {
  appState.resumeSizePx = Math.max(11, Math.min(17, appState.resumeSizePx + delta));
  const inner = $('#tpl-inner');
  if (inner) inner.style.fontSize = `${appState.resumeSizePx}px`;
}

function goToCV() {
  navigateTo("cv.html");
}

function goToResume() {
  navigateTo("index.html");
}
function selectTemplate(templateId) {
  // Save selected template
  localStorage.setItem("selectedTemplate", templateId);

  // Redirect to form screen
  document.getElementById("screen-home").classList.remove("active");
  document.getElementById("screen-form").classList.add("active");
}

window.onload = function () {
  document.body.classList.add('page-loaded');
  const template = localStorage.getItem("selectedTemplate") || 1;

  // Update label
  const label = document.getElementById("form-template-label");

  if (template == 1) {
    label.innerText = "Template 1 — Clean Professional";
  }
  if (template == 2) {
    label.innerText = "Template 2 — Two Column Sidebar";

    // Show photo field only for template 2
    document.getElementById("photo-field").style.display = "block";
  }
  if (template == 3) {
    label.innerText = "Template 3 — Modern Minimal";
  }
};

// -----------------------------------------------------------------------------
// AI helpers removed per user request
// -----------------------------------------------------------------------------
// No AI function is used in this version. All suggestions are manual data entry.


// -----------------------------------------------------------------------------
// UI QUICk FEEDBACK
// -----------------------------------------------------------------------------
function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// -----------------------------------------------------------------------------
// Start-up initialization
// -----------------------------------------------------------------------------
function initializeApp() {
  if (appState.experiences.length === 0) addExperience();
  if (appState.educations.length === 0) addEducation();
  if (appState.projects.length === 0) addProject();
  liveScore();
}

initializeApp();
