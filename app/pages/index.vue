<script setup lang="ts">
definePageMeta({ layout: 'public' })

const stats = [
  { n: '15+', l: 'Years of Excellence' },
  { n: '40+', l: 'Programs Offered' },
  { n: '10,000+', l: 'Graduates Worldwide' },
  { n: '30+', l: 'Global Lecturers' },
]

const features = [
  { t: 'Daily task entries', d: 'Students log each day’s work — like the paper logbook, with optional diagrams and images.', icon: 'pencil' },
  { t: 'Supervisor sign-offs', d: 'Company and academic supervisors review, comment, approve, and grade — no edits to student work.', icon: 'check-circle' },
  { t: 'Monthly summaries', d: 'A clear summary of each month of the placement, signed off by supervisors.', icon: 'calendar' },
  { t: 'Final IT stamp', d: 'The Super Admin applies the final institutional stamp on completed entries and summaries.', icon: 'building' },
]
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="bg-gradient-to-b from-caleb-surface to-white">
      <div class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:py-20">
        <div>
          <span class="inline-block rounded-full bg-caleb-cyan/15 px-3 py-1 text-xs font-semibold text-caleb-cyan-dark">
            Students Industrial Work Experience Scheme
          </span>
          <h1 class="mt-4 text-4xl font-extrabold leading-tight text-caleb-navy sm:text-5xl">
            Your SIWES logbook,<br />now digital.
          </h1>
          <p class="mt-4 max-w-lg text-lg text-gray-600">
            The official Caleb University electronic logbook — record your daily industrial
            training, get supervisor approvals, and keep everything in one place.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <NuxtLink to="/signup" class="btn-primary px-6 py-3 text-base">Create student account</NuxtLink>
            <NuxtLink to="/login" class="btn-outline px-6 py-3 text-base">Sign in</NuxtLink>
          </div>
          <p class="mt-4 text-sm text-gray-500">For God and Humanity · Imota, Lagos.</p>
        </div>
        <div class="relative">
          <img
            src="/campus-gate.webp"
            alt="Caleb University main gate"
            class="w-full rounded-2xl border border-gray-200 shadow-lg"
          />
          <div class="absolute -bottom-4 -left-4 hidden rounded-xl bg-caleb-navy px-5 py-3 text-white shadow-lg sm:block">
            <p class="text-sm font-semibold">Caleb University</p>
            <p class="text-xs text-caleb-cyan">Lagos, Nigeria</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="bg-caleb-navy">
      <div class="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4">
        <div v-for="s in stats" :key="s.l" class="text-center">
          <p class="text-3xl font-extrabold text-caleb-cyan">{{ s.n }}</p>
          <p class="mt-1 text-sm text-gray-300">{{ s.l }}</p>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="mx-auto max-w-6xl px-4 py-16">
      <div class="mb-10 text-center">
        <h2 class="text-3xl font-bold text-caleb-navy">Everything the paper logbook does — better</h2>
        <p class="mt-2 text-gray-600">Built for students, supervisors, and the SIWES unit.</p>
      </div>
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="f in features" :key="f.t" class="card p-6">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-caleb-cyan/15 text-caleb-cyan-dark">
            <AppIcon :name="f.icon" :size="24" />
          </div>
          <h3 class="mt-3 font-semibold text-caleb-navy">{{ f.t }}</h3>
          <p class="mt-2 text-sm text-gray-600">{{ f.d }}</p>
        </div>
      </div>
    </section>

    <!-- About Caleb teaser -->
    <section class="bg-caleb-surface">
      <div class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2">
        <img src="/campus-event.jpg" alt="Caleb University" class="w-full rounded-2xl border border-gray-200 shadow" />
        <div>
          <h2 class="text-3xl font-bold text-caleb-navy">About Caleb University</h2>
          <p class="mt-4 text-gray-600">
            Caleb University is a centre for teaching, learning and research, persistently ranked
            among the top 10 most sought-after private universities in Nigeria. Since 2007, CUL has
            been investing in people with the curiosity, drive, passion and empathy to positively
            impact their environment while also being globally competitive.
          </p>
          <NuxtLink to="/about" class="btn-secondary mt-6">Read more about Caleb →</NuxtLink>
        </div>
      </div>
    </section>

    <!-- SIWES teaser -->
    <section class="mx-auto max-w-6xl px-4 py-16">
      <div class="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 class="text-3xl font-bold text-caleb-navy">What is SIWES?</h2>
          <p class="mt-4 text-gray-600">
            The Students Industrial Work Experience Scheme was established by the Industrial Training
            Fund (ITF) so that graduates gain practical, real-world experience alongside their
            theoretical education. At Caleb University, the SIWES unit coordinates a six-month
            industrial training programme across all colleges.
          </p>
          <NuxtLink to="/siwes" class="btn-secondary mt-6">Learn about SIWES →</NuxtLink>
        </div>
        <img src="/campus-tech.jpg" alt="Industrial training" class="mx-auto max-h-96 rounded-2xl border border-gray-200 shadow" />
      </div>
    </section>

    <!-- CTA -->
    <section class="bg-caleb-cyan-dark">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-12 text-center sm:flex-row sm:text-left">
        <div>
          <h2 class="text-2xl font-bold text-white">Ready to start your logbook?</h2>
          <p class="mt-1 text-white/80">Create your student account in under a minute.</p>
        </div>
        <NuxtLink to="/signup" class="btn bg-white px-6 py-3 text-base font-semibold text-caleb-navy hover:bg-gray-100">
          Get started
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
