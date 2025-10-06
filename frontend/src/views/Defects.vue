<template>
  <div class="container mt-5">
    <h2>Дефекты проекта #{{ $route.params.projectId }}</h2>

    <button class="btn btn-secondary mb-4" @click="goBack">Вернуться к проектам</button>

    <button class="btn btn-primary mb-4" @click="testClick('add')">Добавить дефект</button>

    <div v-if="editingDefect">
      <button class="btn btn-warning mb-4 ms-2" @click="testClick('edit')">Редактировать дефект</button>
    </div>

    <div v-if="defects.length > 0" class="mb-4">
      <button class="btn btn-info me-2" @click="exportDefects('csv')">Экспорт дефектов в CSV</button>
      <button class="btn btn-info" @click="exportDefects('excel')">Экспорт дефектов в Excel</button>
    </div>

    <h3>Дефекты проекта</h3>
    <div v-if="defects.length > 0">
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Описание</th>
            <th>Приоритет</th>
            <th>Статус</th>
            <th>Исполнитель</th>
            <th>Срок</th>
            <th>Вложения</th>
            <th>Дата создания</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="defect in defects" :key="defect.id">
            <td>{{ defect.description }}</td>
            <td>{{ defect.priority }}</td>
            <td>{{ {
              'new': 'Новый',
              'in_work': 'В работе',
              'on_review': 'На проверке',
              'closed': 'Закрыт',
              'canceled': 'Отменён'
            }[defect.status] || defect.status }}</td>
            <td>{{ defect.assigneeEmail || '-' }}</td>
            <td>{{ defect.dueDate ? new Date(defect.dueDate).toLocaleDateString() : '-' }}</td>
            <td>
              <div v-if="defect.attachments && defect.attachments.length > 0" class="attachments">
                <button class="btn btn-sm btn-secondary" @click="downloadAll(defect.id)">Скачать все</button>
              </div>
              <span v-else>-</span>
            </td>
            <td>{{ new Date(defect.createdAt).toLocaleDateString() }}</td>
            <td>
              <button class="btn btn-sm btn-warning me-2" @click="startEditDefect(defect)">Редактировать</button>
              <button class="btn btn-sm btn-danger" @click="deleteDefect(defect.id)">Удалить</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else>
      <p>У проекта пока нет дефектов.</p>
    </div>

    <ModalForm
      :title="isEditing ? 'Редактировать дефект' : 'Добавить дефект'"
      :value="showModal"
      @update:value="showModal = $event"
      :isProject="false"
      :users="users"
      :onSubmit="handleSubmit"
      :initialData="editingDefect ? { ...editingDefect, dueDate: editingDefect.dueDate ? new Date(editingDefect.dueDate).toISOString().split('T')[0] : '', attachments: editingDefect.attachments || [] } : null"
    />
  </div>
</template>

<script>
import axios from 'axios';
import ModalForm from '@/components/ModalForm.vue';

export default {
  components: { ModalForm },
  data() {
    return {
      showModal: false,
      isEditing: false,
      editingDefect: null,
      defects: [],
      users: []
    };
  },
  watch: {
    showModal(newVal) {
      console.log('showModal в Defects изменилось на:', newVal);
    }
  },
  methods: {
    testClick(action) {
      console.log(`Кнопка ${action} нажата в Defects, до изменения showModal:`, this.showModal);
      this.showModal = true;
      this.isEditing = action === 'edit';
      console.log(`После изменения showModal:`, this.showModal);
    },
    goBack() {
      this.$router.push('/projects');
    },
    startEditDefect(defect) {
      this.editingDefect = { ...defect };
      this.testClick('edit');
    },
    async createDefect(data) {
      const formData = new FormData();
      formData.append('projectId', this.$route.params.projectId);
      formData.append('description', data.description);
      formData.append('priority', data.priority);
      formData.append('status', data.status);
      formData.append('assigneeId', data.assigneeId || null);
      formData.append('dueDate', data.dueDate ? new Date(data.dueDate).getTime() : null);
      data.attachments.forEach(file => formData.append('attachments', file));
      try {
        const response = await axios.post('http://localhost:3000/api/defects', formData, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert(`Дефект создан: ${response.data.message}`);
        this.fetchDefects();
      } catch (error) {
        alert(`Ошибка создания дефекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    async updateDefect(data) {
      const formData = new FormData();
      formData.append('description', data.description);
      formData.append('priority', data.priority);
      formData.append('status', data.status);
      formData.append('assigneeId', data.assigneeId || null);
      formData.append('dueDate', data.dueDate ? new Date(data.dueDate).getTime() : null);
      data.attachments.forEach(file => formData.append('attachments', file));
      try {
        const response = await axios.put(`http://localhost:3000/api/defects/${this.editingDefect.id}`, formData, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert(`Дефект обновлён: ${response.data.message}`);
        this.editingDefect = null;
        this.fetchDefects();
      } catch (error) {
        alert(`Ошибка обновления дефекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    async deleteDefect(defectId) {
      if (!confirm('Вы уверены, что хотите удалить дефект?')) return;
      try {
        const response = await axios.delete(`http://localhost:3000/api/defects/${defectId}`, { withCredentials: true });
        alert(`Дефект удалён: ${response.data.message}`);
        this.fetchDefects();
      } catch (error) {
        alert(`Ошибка удаления дефекта: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    async exportDefects(format) {
      try {
        const response = await axios.get(`http://localhost:3000/api/export/defects?projectId=${this.$route.params.projectId}&format=${format}`, {
          withCredentials: true,
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `defects_${this.$route.params.projectId}.${format === 'csv' ? 'csv' : 'xlsx'}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        alert(`Ошибка экспорта дефектов: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    async fetchDefects() {
      try {
        const response = await axios.get(`http://localhost:3000/api/defects?projectId=${this.$route.params.projectId}`, { withCredentials: true });
        this.defects = response.data.defects.map(defect => ({
          ...defect,
          assigneeEmail: response.data.users.find(user => user.id === defect.assigneeId)?.email || null
        }));
      } catch (error) {
        alert(`Ошибка загрузки дефектов: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    async fetchUsers() {
      try {
        const response = await axios.get('http://localhost:3000/api/users', { withCredentials: true });
        this.users = response.data.users;
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
      }
    },
    async downloadAll(defectId) {
      try {
        const response = await axios.get(`http://localhost:3000/api/download/attachments/${defectId}`, {
          withCredentials: true,
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `attachments_${defectId}.zip`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        alert(`Ошибка скачивания: ${error.response?.data?.message || 'Ошибка сервера'}`);
      }
    },
    handleSubmit(data) {
      if (this.isEditing) {
        this.updateDefect(data);
      } else {
        this.createDefect(data);
      }
      this.showModal = false;
      this.isEditing = false;
      this.editingDefect = null;
    }
  },
  mounted() {
    this.fetchDefects();
    this.fetchUsers();
  }
};
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: auto;
}
.table {
  margin-top: 20px;
}
.attachments {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
</style>