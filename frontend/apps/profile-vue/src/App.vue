<script setup lang="ts">
import { onMounted, ref } from "vue";
import Button from "primevue/button";
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Tag from "primevue/tag";

import { getCurrentUser, updateCurrentUser, type User } from "@sashecka/api-client";
import { getAuthSession, updateAuthUser } from "@sashecka/auth-session";

defineProps<{
  apiBaseUrl: string;
  routePath: string;
}>();

const loading = ref(true);
const saving = ref(false);
const user = ref<User | null>(getAuthSession().user);
const accentColor = ref("#4c6ef5");
const bio = ref("");
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

onMounted(async () => {
  try {
    const currentUser = await getCurrentUser();
    user.value = currentUser;
    accentColor.value = currentUser.profile_accent_color || "#4c6ef5";
    bio.value = currentUser.profile_bio || "";
  } finally {
    loading.value = false;
  }
});

async function saveProfileCustomization() {
  if (!user.value) {
    return;
  }

  saving.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  try {
    const updatedUser = await updateCurrentUser({
      email: user.value.email,
      username: user.value.username,
      full_name: user.value.full_name ?? null,
      profile_bio: bio.value.trim() || null,
      profile_accent_color: accentColor.value,
    });
    user.value = updatedUser;
    bio.value = updatedUser.profile_bio || "";
    accentColor.value = updatedUser.profile_accent_color || "#4c6ef5";
    updateAuthUser(updatedUser);
    successMessage.value = "Кастомизация профиля сохранена.";
  } catch {
    errorMessage.value = "Не удалось сохранить кастомизацию профиля.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="profile-page">
    <Card class="profile-card" :style="{ borderTop: `4px solid ${accentColor}` }">
      <template #title>Профиль</template>
      <template #subtitle>
        Настрой внешний вид своего профиля: акцентный цвет и описание.
      </template>
      <template #content>
        <div v-if="loading">Загружаем профиль...</div>
        <div v-else class="profile-content">
          <div class="profile-meta">
            <Tag severity="info" value="Vue profile remote" />
            <Tag severity="contrast" :value="routePath" />
            <Tag :style="{ backgroundColor: accentColor, color: '#ffffff', borderColor: accentColor }" value="Ваш цвет" />
          </div>

          <div class="profile-preview" :style="{ background: `linear-gradient(135deg, ${accentColor}20, transparent)` }">
            <div class="profile-avatar" :style="{ backgroundColor: accentColor }">
              {{ user?.username?.slice(0, 1).toUpperCase() || "U" }}
            </div>
            <div class="profile-preview-copy">
              <strong>{{ user?.full_name || user?.username || "Unknown" }}</strong>
              <span>{{ bio || "Добавь пару слов о себе, чтобы профиль выглядел живее." }}</span>
            </div>
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
            <div class="color-row">
              <input v-model="accentColor" class="color-picker" type="color" />
              <InputText v-model="accentColor" />
            </div>
          </div>

          <div class="field">
            <label>Описание профиля</label>
            <Textarea v-model="bio" rows="5" maxlength="1000" />
          </div>

          <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
          <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

          <Button
            label="Сохранить кастомизацию"
            :loading="saving"
            @click="saveProfileCustomization"
          />
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

.profile-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: var(--sashecka-radius);
}

.profile-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
}

.profile-preview-copy {
  display: grid;
  gap: 0.35rem;
}

.profile-preview-copy span {
  color: var(--sashecka-text-muted);
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

.color-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.color-picker {
  width: 3rem;
  height: 2.5rem;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.success-message {
  color: #2b8a3e;
}

.error-message {
  color: #c92a2a;
}
</style>
