<template>
  <div v-if="value" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <h2>{{ title }}</h2>
      <form @submit.prevent="submitForm">
        <div v-if="isProject" class="mb-3">
          <label for="name" class="form-label">Название проекта</label>
          <input
            type="text"
            class="form-control"
            id="name"
            v-model.trim="formData.name"
            placeholder="Введите название проекта"
            required
          />
        </div>
        <div class="mb-3">
          <label for="description" class="form-label">{{ isProject ? 'Описание проекта' : 'Описание дефекта' }}</label>
          <textarea
            class="form-control"
            id="description"
            v-model.trim="formData.description"
            placeholder="Введите описание"
            required
          ></textarea>
        </div>
        <div class="mb-3">
          <label for="status" class="form-label">Статус</label>
          <select
            class="form-control"
            id="status"
            v-model="formData.status"
            required
          >
            <option v-if="isProject" value="open">Открыт</option>
            <option v-if="isProject" value="in progress">В процессе</option>
            <option v-if="isProject" value="closed">Закрыт</option>
            <option v-if="!isProject" value="new">Новый</option>
            <option v-if="!isProject" value="in_work">В работе</option>
            <option v-if="!isProject" value="on_review">На проверке</option>
            <option v-if="!isProject" value="closed">Закрыт</option>
            <option v-if="!isProject" value="canceled">Отменён</option>
          </select>
        </div>
        <div v-if="isProject && formData.status === 'closed'" class="mb-3">
          <label for="closedAt" class="form-label">Дата закрытия</label>
          <input
            type="date"
            class="form-control"
            id="closedAt"
            v-model="formData.closedAt"
          />
        </div>
        <div v-if="!isProject" class="mb-3">
          <label for="priority" class="form-label">Приоритет</label>
          <select
            class="form-control"
            id="priority"
            v-model="formData.priority"
            required
          >
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
        </div>
        <div v-if="!isProject" class="mb-3">
          <label for="assigneeId" class="form-label">Исполнитель</label>
          <select
            class="form-control"
            id="assigneeId"
            v-model="formData.assigneeId"
          >
            <option value="">Не назначен</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.email }}
            </option>
          </select>
        </div>
        <div v-if="!isProject" class="mb-3">
          <label for="dueDate" class="form-label">Срок</label>
          <input
            type="date"
            class="form-control"
            id="dueDate"
            v-model="formData.dueDate"
          />
        </div>
        <div v-if="!isProject" class="mb-3">
          <label for="attachments" class="form-label">Вложения (URL)</label>
          <input
            type="text"
            class="form-control"
            id="attachments"
            v-model="formData.attachments"
            placeholder="Введите URL через запятую (например, file1.jpg, file2.pdf)"
          />
        </div>
        <button type="submit" class="btn btn-success">Сохранить</button>
        <button type="button" class="btn btn-secondary ms-2" @click="closeModal">Отмена</button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    title: String,
    value: {
      type: Boolean,
      default: false
    },
    isProject: Boolean,
    users: Array,
    onSubmit: Function,
    initialData: Object
  },
  data() {
    return {
      formData: {
        name: '',
        description: '',
        status: this.isProject ? 'open' : 'new',
        priority: 'medium',
        assigneeId: '',
        dueDate: '',
        attachments: '',
        closedAt: ''
      }
    };
  },
  watch: {
    value(newVal) {
      console.log('value в ModalForm изменилось на:', newVal);
      if (newVal && this.initialData) {
        this.formData = { ...this.initialData };
      } else if (!newVal) {
        this.formData = {
          name: '',
          description: '',
          status: this.isProject ? 'open' : 'new',
          priority: 'medium',
          assigneeId: '',
          dueDate: '',
          attachments: '',
          closedAt: ''
        };
      }
    },
    initialData(newVal) {
      if (newVal && this.value) {
        this.formData = { ...newVal };
      }
    }
  },
  methods: {
    submitForm() {
      this.onSubmit(this.formData);
      this.closeModal();
    },
    closeModal() {
      this.$emit('update:value', false);
    }
  },
  created() {
    console.log('ModalForm создан, начальное value:', this.value);
  },
  mounted() {
    console.log('ModalForm смонтирован, текущее value:', this.value);
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.3s;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 5px;
  width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

input, textarea, select {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 3px;
}

button {
  padding: 5px 10px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>