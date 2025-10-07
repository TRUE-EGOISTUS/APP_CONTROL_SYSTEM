<template>
  <div class="container mt-5">
    <h2>Дефекты проекта #{{ $route.params.projectId }}</h2>

    <button class="btn btn-secondary mb-4" @click="goBack">Вернуться к проектам</button>
    <button class="btn btn-primary mb-4" @click="testClick('add')">Добавить дефект</button>

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
            <th>Комментарии</th>
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
              <button class="btn btn-info btn-sm" @click="openCommentsModal(defect.id)">
                Посмотреть комментарии ({{ defect.comments.length }})
              </button>
            </td>
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
      <p v-if="errorMessage">{{ errorMessage }}</p>
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

    <!-- Модальное окно для комментариев -->
    <div class="modal fade" tabindex="-1" ref="commentsModal" aria-labelledby="commentsModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="commentsModalLabel">Комментарии к дефекту #{{ currentDefectId }}</h5>
            <button type="button" class="btn-close" @click="closeCommentsModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div v-if="currentComments && currentComments.length > 0" class="chat-container" style="max-height: 400px; overflow-y: auto;">
              <div v-for="comment in currentComments" :key="comment.id" class="chat-message mb-3">
                <div class="d-flex align-items-start">
                  <div class="flex-shrink-0">
                    <div class="avatar" :style="{ backgroundColor: getColor(comment.userEmail) }"></div>
                  </div>
                  <div class="flex-grow-1 ms-3">
                    <h6 class="mb-0">{{ comment.userEmail }}</h6>
                    <p class="text-muted small mb-1">{{ new Date(comment.createdAt).toLocaleString() }}</p>
                    <p class="mb-0">{{ comment.text }}</p>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-muted">Нет комментариев</p>
            <div class="comment-form mt-3">
              <input
                v-model="newCommentText[currentDefectId]"
                type="text"
                class="form-control mb-2"
                placeholder="Напишите свой комментарий (до 500 символов)"
                :maxlength="500"
              />
              <div class="d-flex gap-2">
                <button
                  class="btn btn-sm btn-success"
                  :disabled="loading || !newCommentText[currentDefectId] || newCommentText[currentDefectId].trim().length === 0"
                  @click="addComment(currentDefectId)"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span v-else>Добавить</span>
                </button>
                <button class="btn btn-sm btn-secondary" @click="cancelComment(currentDefectId)">Отмена</button>
              </div>
              <div v-if="successMessage[currentDefectId]" class="alert alert-success mt-2" role="alert">
                {{ successMessage[currentDefectId] }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import ModalForm from '@/components/ModalForm.vue';
import { Modal } from 'bootstrap'; // Импортируем Modal напрямую

export default {
  components: { ModalForm },
  data() {
    return {
      showModal: false,
      isEditing: false,
      editingDefect: null,
      defects: [],
      users: [],
      newCommentText: {},
      loading: false,
      successMessage: {},
      errorMessage: '',
      currentDefectId: null,
      currentComments: []
    };
  },
  methods: {
    testClick(action) {
      this.showModal = true;
      this.isEditing = action === 'edit';
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
      this.errorMessage = '';
      try {
        const response = await axios.get(`http://localhost:3000/api/defects?projectId=${this.$route.params.projectId}`, { withCredentials: true });
        const defects = response.data.defects.map(defect => ({
          ...defect,
          attachments: defect.attachments ? (typeof defect.attachments === 'string' ? JSON.parse(defect.attachments) : defect.attachments) : []
        }));

        const commentPromises = defects.map(defect =>
          axios.get(`http://localhost:3000/api/comments?defectId=${defect.id}`, { withCredentials: true })
            .then(res => ({ id: defect.id, comments: res.data.comments }))
            .catch(err => {
              console.error(`Ошибка загрузки комментариев для дефекта ${defect.id}:`, err);
              return { id: defect.id, comments: [] };
            })
        );
        const commentResults = await Promise.all(commentPromises);
        const commentMap = Object.fromEntries(commentResults.map(r => [r.id, r.comments]));

        this.defects = defects.map(defect => ({
          ...defect,
          assigneeEmail: response.data.users.find(user => user.id === defect.assigneeId)?.email || null,
          comments: commentMap[defect.id] || []
        }));
      } catch (error) {
        console.error('Ошибка загрузки дефектов:', error);
        this.errorMessage = `Ошибка загрузки дефектов: ${error.response?.data?.message || 'Проверь подключение к серверу'}`;
        this.defects = [];
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
    openCommentsModal(defectId) {
      this.currentDefectId = defectId;
      this.currentComments = this.defects.find(d => d.id === defectId)?.comments || [];
      const modal = new Modal(this.$refs.commentsModal); // Используем импортированный Modal
      modal.show();
    },
    closeCommentsModal() {
      const modal = Modal.getInstance(this.$refs.commentsModal);
      if (modal) modal.hide();
    },
    getColor(email) {
      let hash = 0;
      for (let i = 0; i < email.length; i++) {
        hash = email.charCodeAt(i) + ((hash << 5) - hash);
      }
      const color = `hsl(${hash % 360}, 70%, 80%)`;
      return color;
    },
    async addComment(defectId) {
      const text = this.newCommentText[defectId];
      if (!text || text.trim().length === 0) {
        alert('Пожалуйста, введите текст комментария');
        return;
      }
      if (text.length > 500) {
        alert('Комментарий не должен превышать 500 символов');
        return;
      }
      this.loading = true;
      try {
        await axios.post('http://localhost:3000/api/comments', {
          defectId,
          text
        }, { withCredentials: true });
        this.newCommentText[defectId] = '';
        const commentResponse = await axios.get(`http://localhost:3000/api/comments?defectId=${defectId}`, { withCredentials: true });
        const updatedDefectIndex = this.defects.findIndex(d => d.id === defectId);
        if (updatedDefectIndex !== -1) {
          this.defects[updatedDefectIndex].comments = commentResponse.data.comments;
        }
        this.currentComments = commentResponse.data.comments;
        this.successMessage[defectId] = 'Комментарий успешно добавлен!';
        setTimeout(() => {
          this.successMessage[defectId] = '';
        }, 2000);
      } catch (error) {
        alert(`Ошибка добавления комментария: ${error.response?.data?.message || 'Ошибка сервера'}`);
      } finally {
        this.loading = false;
      }
    },
    cancelComment(defectId) {
      this.newCommentText[defectId] = '';
      this.successMessage[defectId] = '';
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
.chat-container {
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 5px;
}
.chat-message {
  padding: 10px;
  border-bottom: 1px solid #eee;
}
.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
}
.comment-form {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.attachments {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
</style>