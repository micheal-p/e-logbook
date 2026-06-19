<script setup lang="ts">
definePageMeta({ layout: 'public' })
useHead({ title: 'About SIWES — Caleb University E-Logbook' })

// SIWES unit functions, from the Caleb University SIWES page.
const functions = [
  { t: 'Student Registration', d: 'Gather student information to ensure they meet the eligibility criteria and register them for the SIWES program.' },
  { t: 'Student Placement', d: 'For students having difficulty securing placements, the unit solicits relevant industrial training jobs and matches students to them.' },
  { t: 'Logbook Administration', d: 'Distributing and monitoring student logbooks, which record their daily activities, challenges, and achievements.' },
  { t: 'Supervisor Assignment & Reports', d: 'Assigning institution supervisors to visit, supervise and evaluate students, then reviewing their reports to assess performance.' },
  { t: 'Monitoring Progress', d: 'Carrying out follow-up and monitoring of students during placement to ensure they meet expectations and to address challenges.' },
  { t: 'Student Support', d: 'Providing counselling and guidance to students before, during, and after their SIWES placement and resolving issues that arise.' },
  { t: 'Coordinating with ITF & Partners', d: 'Liaising between the university and ITF on all industrial-training matters and maintaining relationships with industry partners.' },
  { t: 'Ensuring Compliance', d: 'Ensuring compliance with SIWES guidelines, regulations and policies, and assessing the appropriateness of training jobs.' },
]
</script>

<template>
  <div>
    <!-- Header -->
    <section class="bg-caleb-navy text-white">
      <div class="mx-auto max-w-6xl px-4 py-14">
        <p class="text-sm font-semibold text-caleb-cyan">Students Industrial Work Experience Scheme</p>
        <h1 class="mt-2 text-4xl font-extrabold">About SIWES</h1>
        <p class="mt-3 max-w-2xl text-gray-300">
          A six-month industrial training programme coordinated by the SIWES unit across all
          colleges of Caleb University.
        </p>
      </div>
    </section>

    <!-- Intro -->
    <section class="mx-auto max-w-6xl px-4 py-16">
      <div class="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 class="text-2xl font-bold text-caleb-navy">What SIWES is</h2>
          <p class="mt-4 text-gray-600">
            The Students Industrial Work Experience Scheme (SIWES) was established by the Industrial
            Training Fund (ITF) to address the concern that graduates of higher institutions were
            exposed only to theoretical education and lacked the practical knowledge required in
            industry and the labour market.
          </p>
          <p class="mt-4 text-gray-600">
            In alignment with the objectives of the scheme, the SIWES unit of Caleb University
            coordinates the industrial training programmes for the approved courses across all
            colleges of the university — providing students with valuable work experience and
            maintaining partnerships with industries and organisations.
          </p>
          <div class="mt-6 flex gap-4">
            <div class="rounded-xl bg-caleb-surface px-5 py-3">
              <p class="text-2xl font-extrabold text-caleb-navy">6</p>
              <p class="text-xs text-gray-500">months duration</p>
            </div>
            <div class="rounded-xl bg-caleb-surface px-5 py-3">
              <p class="text-2xl font-extrabold text-caleb-navy">300L</p>
              <p class="text-xs text-gray-500">typical level</p>
            </div>
          </div>
        </div>
        <img src="/campus-tech.jpg" alt="Industrial training" class="mx-auto max-h-[28rem] rounded-2xl border border-gray-200 shadow" />
      </div>
    </section>

    <!-- Unit functions -->
    <section class="bg-caleb-surface">
      <div class="mx-auto max-w-6xl px-4 py-16">
        <h2 class="text-2xl font-bold text-caleb-navy">What the SIWES Unit does</h2>
        <p class="mt-2 text-gray-600">
          The unit handles everything from pre-SIWES placement to monitoring, administration and
          compliance.
        </p>
        <div class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div v-for="(f, i) in functions" :key="f.t" class="card flex gap-4 p-5">
            <div class="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-caleb-navy text-sm font-bold text-caleb-cyan">
              {{ i + 1 }}
            </div>
            <div>
              <h3 class="font-semibold text-caleb-navy">{{ f.t }}</h3>
              <p class="mt-1 text-sm text-gray-600">{{ f.d }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Director -->
    <section class="mx-auto max-w-6xl px-4 py-16">
      <div class="card p-6 sm:p-8">
        <p class="text-sm font-semibold text-caleb-cyan-dark">SIWES Ag. Director</p>
        <h2 class="mt-1 text-2xl font-bold text-caleb-navy">Dr Oluwaseun Adeyeye</h2>
        <p class="mt-4 text-gray-600">
          As Acting Director of SIWES, Dr Adeyeye oversees the planning, coordination, and
          evaluation of students' industrial training programmes — ensuring alignment between
          academic preparation, industry relevance, employability skills, and national development
          goals. She champions structured pre-SIWES training, virtual and hybrid skill programmes,
          industry partnerships, and post-SIWES performance evaluation, emphasising digital skills,
          analytics literacy, professional ethics, workplace readiness, and continuous feedback to
          enhance students' transition from classroom learning to industry practice.
        </p>
      </div>
    </section>

    <!-- CTA -->
    <section class="bg-caleb-cyan-dark">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-center sm:flex-row sm:text-left">
        <div>
          <h2 class="text-2xl font-bold text-white">Start your SIWES logbook today</h2>
          <p class="mt-1 text-white/80">Record your daily training and get supervisor sign-offs online.</p>
        </div>
        <NuxtLink to="/signup" class="btn bg-white px-6 py-3 font-semibold text-caleb-navy hover:bg-gray-100">
          Create student account
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
