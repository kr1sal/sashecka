<script setup lang="ts">
import { onMounted, ref } from "vue";
import Button from "primevue/button";
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Tag from "primevue/tag";

import { getCurrentUser } from "@sashecka/api-client";
import { getAuthSession } from "@sashecka/auth-session";

defineProps<{
  apiBaseUrl: string;
  routePath: string;
}>();

const loading = ref(true);
const user = ref(getAuthSession().user);
const accentColor = ref("#4c6ef5");
const bio = ref("Здесь позже появится кастомизация профиля.");

onMounted(async () => {
  try {
    user.value = await getCurrentUser();
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="profile-page">
    <Card class="profile-card">
      <template #title>Vue profile remote</template>
      <template #subtitle>
        Страница профиля пользователя. Сейчас это заглушка для будущей кастомизации.
      </template>
      <template #content>
        <div v-if="loading">Загружаем профиль...</div>
        <div v-else class="profile-content">
          <div class="profile-meta">
            <Tag severity="info" value="Vue + PrimeVue" />
            <Tag severity="contrast" :value="routePath" />
          </div>

          <div class="field">
            <label>Пользователь</label>
            <InputText :model-value="user?.full_name || user?.username || 'Unknown'" disabled />
          </div>

          <div class="field">
            <label>Email</label>
            <InputText :model-value="user?.email || 'Неизвестно'" disabled />
          </div>

          <div class="field">
            <label>Акцентный цвет профиля</label>
            <InputText v-model="accentColor" />
          </div>

          <div class="field">
            <label>Описание профиля</label>
            <Textarea v-model="bio" rows="5" />
          </div>

          <Button label="Сохранить позже" severity="secondary" disabled />
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 320px;
}

.profile-card {
  border-radius: var(--sashecka-radius);
  box-shadow: var(--sashecka-shadow);
}

.profile-content {
  display: grid;
  gap: 1rem;
}

.profile-meta {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.field {
  display: grid;
  gap: 0.35rem;
}

label {
  font-size: 0.9rem;
  color: var(--sashecka-text-muted);
}
</style>
