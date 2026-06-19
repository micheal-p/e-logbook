<script setup lang="ts">
definePageMeta({ layout: 'public' })
useHead({ title: 'About Caleb University — E-Logbook' })

const officers = [
  { name: 'Prof. Olalekan Asikhia', role: 'Vice Chancellor' },
  { name: 'Prof. Olumuyiwa Sunday Adewale', role: 'DVC (Academic)' },
  { name: 'Prof. Adesola Adetutu Ajayi', role: 'DVC (RISA)' },
  { name: 'Mayokun Olumeru', role: 'Registrar' },
  { name: 'Adesina Abubakre', role: 'Bursar' },
]
</script>

<template>
  <div>
    <!-- Page header -->
    <section class="bg-caleb-navy text-white">
      <div class="mx-auto max-w-6xl px-4 py-14">
        <p class="text-sm font-semibold text-caleb-cyan">Caleb University</p>
        <h1 class="mt-2 text-4xl font-extrabold">About Caleb University</h1>
        <p class="mt-3 max-w-2xl text-gray-300">
          Africa's Best Private University in Research and Entrepreneurship Development.
        </p>
      </div>
    </section>

    <!-- Intro -->
    <section class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2">
      <img src="/campus-gate.webp" alt="Caleb University gate" class="w-full rounded-2xl border border-gray-200 shadow" />
      <div>
        <h2 class="text-2xl font-bold text-caleb-navy">Study! Your Future Is Here!</h2>
        <p class="mt-4 text-gray-600">
          Caleb University is a centre for teaching, learning and research, persistently ranked
          among the top 10 most sought-after private universities in Nigeria. CUL embraces
          innovation and transforms ideas into action.
        </p>
        <p class="mt-4 text-gray-600">
          Since 2007, CUL has been investing in people with the curiosity, drive, passion and
          empathy to positively impact their environment while also being globally competitive.
        </p>
        <p class="mt-4 inline-block rounded-lg bg-caleb-surface px-4 py-2 text-sm font-semibold text-caleb-navy">
          Motto: “For God and Humanity”
        </p>
      </div>
    </section>

    <!-- Vision / Mission / Philosophy -->
    <section class="bg-caleb-surface">
      <div class="mx-auto max-w-6xl px-4 py-16">
        <div class="grid gap-6 lg:grid-cols-3">
          <div class="card border-t-4 border-caleb-cyan p-6">
            <h3 class="text-lg font-bold text-caleb-navy">Our Vision</h3>
            <p class="mt-3 text-sm text-gray-600">
              To be the leader in producing manpower in Commerce, Technology and the environment;
              with due regard of relevance to societal needs. The University intends to be the
              foremost institution to produce graduates with sufficient theoretical base buttressed
              with practical skills to face the challenges of employment opportunities — with
              attributes of innovation, creativity and self-reliance.
            </p>
          </div>
          <div class="card border-t-4 border-caleb-green p-6">
            <h3 class="text-lg font-bold text-caleb-navy">Our Mission</h3>
            <p class="mt-3 text-sm text-gray-600">
              To provide opportunities for respectable, qualitative and relevant university
              education for regular and mature students, with due recognition of gender sensitivity
              for good and balanced societal development.
            </p>
          </div>
          <div class="card border-t-4 border-caleb-navy p-6">
            <h3 class="text-lg font-bold text-caleb-navy">Our Philosophy</h3>
            <p class="mt-3 text-sm text-gray-600">
              The philosophy of the University is to commit itself to the training of future leaders
              imbued with ability and integrity, with focus on overall success building.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Principal officers -->
    <section class="mx-auto max-w-6xl px-4 py-16">
      <h2 class="text-2xl font-bold text-caleb-navy">Principal Officers</h2>
      <p class="mt-2 text-gray-600">
        Leadership driving vision, governance, and academic excellence.
      </p>
      <div class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div v-for="o in officers" :key="o.name" class="card p-4 text-center">
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-caleb-navy text-lg font-bold text-caleb-cyan">
            {{ o.name.split(' ').map((p) => p[0]).slice(-2).join('') }}
          </div>
          <p class="mt-3 text-sm font-semibold text-caleb-navy">{{ o.name }}</p>
          <p class="text-xs text-gray-500">{{ o.role }}</p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="bg-caleb-cyan-dark">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-center sm:flex-row sm:text-left">
        <h2 class="text-2xl font-bold text-white">Doing your SIWES at Caleb?</h2>
        <NuxtLink to="/siwes" class="btn bg-white px-6 py-3 font-semibold text-caleb-navy hover:bg-gray-100">
          About the SIWES programme →
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
